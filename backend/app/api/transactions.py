from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Transaction, FraudAlert
from app.schemas.schemas import TransactionOut, FraudAlertOut, StatsOut, TransactionCreate
from app.core.fraud import detect_fraud
import uuid
from datetime import datetime, timezone
from typing import List

router = APIRouter()

@router.get("/transactions", response_model=List[TransactionOut])
def get_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(100).all()

@router.get("/fraud-alerts", response_model=List[FraudAlertOut])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(FraudAlert).order_by(FraudAlert.timestamp.desc()).limit(50).all()

@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    total_transactions = db.query(Transaction).count()
    total_fraud = db.query(Transaction).filter(Transaction.is_fraud == 1).count()
    fraud_rate = (total_fraud / total_transactions) if total_transactions > 0 else 0.0
    
    green_count = db.query(Transaction).filter(Transaction.color == "green").count()
    orange_count = db.query(Transaction).filter(Transaction.color == "orange").count()
    red_count = db.query(Transaction).filter(Transaction.color == "red").count()
    
    return {
        "total_transactions": total_transactions,
        "total_fraud": total_fraud,
        "fraud_rate": fraud_rate,
        "green_count": green_count,
        "orange_count": orange_count,
        "red_count": red_count
    }

@router.post("/transaction", response_model=TransactionOut)
async def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    if data.sender_id == data.receiver_id:
        raise HTTPException(status_code=400, detail="Sender and receiver cannot be the same")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # 1. Run Detection
    fraud_result = detect_fraud(data.sender_id, data.receiver_id, data.amount, db)
    
    # 2. Create Transaction
    txn_id = str(uuid.uuid4())[:8]
    new_txn = Transaction(
        transaction_id=txn_id,
        sender_id=data.sender_id,
        receiver_id=data.receiver_id,
        amount=data.amount,
        timestamp=datetime.now(timezone.utc),
        is_fraud=fraud_result["is_fraud"],
        risk_score=fraud_result["risk_score"],
        color=fraud_result["color"],
        fraud_reason=fraud_result["reason"]
    )
    db.add(new_txn)
    
    # 3. Create Alert if fraud
    if fraud_result["is_fraud"] or fraud_result["color"] != "green":
        alert = FraudAlert(
            alert_id=str(uuid.uuid4())[:8],
            transaction_id=txn_id,
            reason=fraud_result["reason"] or "Suspicious pattern",
            risk_score=fraud_result["risk_score"],
            pattern_type=fraud_result["reason"] or "ANOMALY",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        # Broadcast Alert
        from app.websocket.manager import manager
        await manager.broadcast({
            "type": "fraud_alert",
            "data": {
                "alert_id": alert.alert_id,
                "transaction_id": txn_id,
                "reason": alert.reason,
                "risk_score": alert.risk_score,
                "pattern_type": alert.pattern_type,
                "timestamp": alert.timestamp.isoformat()
            }
        })
    else:
        db.commit()
    
    db.refresh(new_txn)
    
    # 4. Broadcast Transaction
    from app.websocket.manager import manager
    await manager.broadcast({
        "type": "transaction",
        "data": {
            "transaction_id": new_txn.transaction_id,
            "sender_id": new_txn.sender_id,
            "receiver_id": new_txn.receiver_id,
            "amount": new_txn.amount,
            "timestamp": new_txn.timestamp.isoformat(),
            "is_fraud": new_txn.is_fraud,
            "risk_score": new_txn.risk_score,
            "color": new_txn.color,
            "fraud_reason": new_txn.fraud_reason
        }
    })
    
    return new_txn
