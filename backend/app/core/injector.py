import time
import threading
import uuid
from app.db.database import SessionLocal
from app.db.models import Transaction, FraudAlert
from app.core.fraud import detect_fraud

SCENARIOS = {
    1: {"name": "HIGH_VALUE_TRANSFER", "txns": [{"s": "A", "r": "B", "amt": 95000}]},
    2: {"name": "SMURFING", "txns": [
        {"s": "C", "r": "D", "amt": 9000}, {"s": "C", "r": "E", "amt": 9200},
        {"s": "C", "r": "F", "amt": 8800}, {"s": "C", "r": "G", "amt": 9100},
        {"s": "C", "r": "H", "amt": 8950}, {"s": "C", "r": "I", "amt": 9300},
        {"s": "C", "r": "J", "amt": 8600}]},
    3: {"name": "LAYERING", "txns": [
        {"s": "K", "r": "L", "amt": 50000}, {"s": "L", "r": "M", "amt": 50000},
        {"s": "M", "r": "N", "amt": 50000}, {"s": "N", "r": "O", "amt": 50000}]},
    4: {"name": "CIRCULAR", "txns": [
        {"s": "A", "r": "B", "amt": 30000}, {"s": "B", "r": "C", "amt": 30000},
        {"s": "C", "r": "A", "amt": 30000}]},
    5: {"name": "RAPID_BURST", "txns": [
        {"s": "D", "r": "E", "amt": 5000}, {"s": "D", "r": "F", "amt": 5000},
        {"s": "D", "r": "G", "amt": 5000}, {"s": "D", "r": "H", "amt": 5000},
        {"s": "D", "r": "I", "amt": 5000}, {"s": "D", "r": "J", "amt": 5000},
        {"s": "D", "r": "K", "amt": 5000}, {"s": "D", "r": "L", "amt": 5000},
        {"s": "D", "r": "M", "amt": 5000}, {"s": "D", "r": "N", "amt": 5000}]}
}

def inject_fraud(scenario_number: int, broadcast_fn):
    def work():
        scenario = SCENARIOS.get(scenario_number)
        if not scenario:
            return
            
        for t_info in scenario["txns"]:
            db = SessionLocal()
            try:
                s, r, amt = t_info["s"], t_info["r"], t_info["amt"]
                fraud_result = detect_fraud(s, r, amt, db)
                
                txn_id = str(uuid.uuid4())[:8]
                txn = Transaction(
                    transaction_id=txn_id,
                    sender_id=s,
                    receiver_id=r,
                    amount=amt,
                    is_fraud=fraud_result["is_fraud"],
                    risk_score=fraud_result["risk_score"],
                    color=fraud_result["color"],
                    fraud_reason=fraud_result["reason"]
                )
                db.add(txn)
                db.commit()
                db.refresh(txn)

                broadcast_fn({
                    "type": "transaction",
                    "data": {
                        "transaction_id": txn.transaction_id,
                        "sender_id": txn.sender_id,
                        "receiver_id": txn.receiver_id,
                        "amount": txn.amount,
                        "timestamp": txn.timestamp.isoformat(),
                        "is_fraud": txn.is_fraud,
                        "risk_score": txn.risk_score,
                        "color": txn.color,
                        "fraud_reason": txn.fraud_reason
                    }
                })

                if txn.is_fraud == 1:
                    alert_id = str(uuid.uuid4())[:8]
                    alert = FraudAlert(
                        alert_id=alert_id,
                        transaction_id=txn.transaction_id,
                        reason=txn.fraud_reason,
                        risk_score=txn.risk_score,
                        pattern_type=txn.fraud_reason
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    
                    broadcast_fn({
                        "type": "fraud_alert",
                        "data": {
                            "alert_id": alert_id,
                            "transaction_id": txn.transaction_id,
                            "reason": txn.fraud_reason,
                            "risk_score": txn.risk_score,
                            "pattern_type": txn.fraud_reason,
                            "timestamp": txn.timestamp.isoformat()
                        }
                    })
                time.sleep(0.3)
            finally:
                db.close()
                
    thread = threading.Thread(target=work, daemon=True)
    thread.start()
