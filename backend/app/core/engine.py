import time
import random
import threading
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Account, Transaction, FraudAlert
from app.core.fraud import detect_fraud
from datetime import datetime
import uuid

engine_state = {"status": "stopped", "rate": 60, "count": 0, "target": None}
_engine_thread = None

def run_engine(broadcast_fn):
    db: Session = SessionLocal()
    try:
        accounts = db.query(Account).all()
        account_ids = [a.account_id for a in accounts]
        
        while engine_state["status"] != "stopped":
            if engine_state["status"] == "paused":
                time.sleep(0.5)
                continue
            
            sender_id, receiver_id = random.sample(account_ids, 2)
            amount = round(random.uniform(500, 15000), 2)
            
            fraud_result = detect_fraud(sender_id, receiver_id, amount, db)
            
            txn_id = str(uuid.uuid4())[:8]
            txn = Transaction(
                transaction_id=txn_id,
                sender_id=sender_id,
                receiver_id=receiver_id,
                amount=amount,
                is_fraud=fraud_result["is_fraud"],
                risk_score=fraud_result["risk_score"],
                color=fraud_result["color"],
                fraud_reason=fraud_result["reason"]
            )
            db.add(txn)
            db.commit()
            db.refresh(txn)

            alert_id = None
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

            engine_state["count"] += 1
            
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

            broadcast_fn({
                "type": "engine_status",
                "data": {
                    "status": engine_state["status"],
                    "rate": engine_state["rate"],
                    "count": engine_state["count"]
                }
            })

            if engine_state["target"] is not None and engine_state["count"] >= engine_state["target"]:
                engine_state["status"] = "stopped"
                break
                
            sleep_time = 60.0 / engine_state["rate"]
            time.sleep(sleep_time)
    finally:
        db.close()

def start_engine(broadcast_fn):
    global _engine_thread
    if _engine_thread is None or not _engine_thread.is_alive():
        engine_state["status"] = "running"
        _engine_thread = threading.Thread(target=run_engine, args=(broadcast_fn,), daemon=True)
        _engine_thread.start()

def stop_engine():
    engine_state["status"] = "stopped"

def pause_engine():
    engine_state["status"] = "paused"

def resume_engine(broadcast_fn):
    engine_state["status"] = "running"
    global _engine_thread
    if _engine_thread is None or not _engine_thread.is_alive():
        _engine_thread = threading.Thread(target=run_engine, args=(broadcast_fn,), daemon=True)
        _engine_thread.start()
