from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Transaction, FraudAlert
from app.schemas.schemas import TransactionOut, FraudAlertOut, StatsOut
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
