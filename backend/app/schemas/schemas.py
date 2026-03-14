from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AccountOut(BaseModel):
    account_id: str
    name: str
    balance: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TransactionOut(BaseModel):
    transaction_id: str
    sender_id: str
    receiver_id: str
    amount: float
    timestamp: datetime
    is_fraud: int
    risk_score: float
    color: str
    fraud_reason: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class FraudAlertOut(BaseModel):
    alert_id: str
    transaction_id: str
    reason: str
    risk_score: float
    pattern_type: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class StatsOut(BaseModel):
    total_transactions: int
    total_fraud: int
    fraud_rate: float
    green_count: int
    orange_count: int
    red_count: int

class EngineStatusOut(BaseModel):
    status: str
    rate: int
    count: int
    target: Optional[int] = None

class TransactionCreate(BaseModel):
    sender_id: str
    receiver_id: str
    amount: float
