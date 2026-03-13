from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from app.db.database import Base
import uuid

def generate_id():
    return str(uuid.uuid4())[:8]

class Account(Base):
    __tablename__ = "accounts"
    account_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    balance = Column(Float, default=100000.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id = Column(String, primary_key=True, default=generate_id)
    sender_id = Column(String, ForeignKey("accounts.account_id"))
    receiver_id = Column(String, ForeignKey("accounts.account_id"))
    amount = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_fraud = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    color = Column(String, default="green")
    fraud_reason = Column(String, nullable=True)

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"
    alert_id = Column(String, primary_key=True, default=generate_id)
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"))
    reason = Column(String)
    risk_score = Column(Float)
    pattern_type = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
