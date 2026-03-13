from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Account
from app.schemas.schemas import AccountOut
from typing import List

router = APIRouter()

@router.get("/accounts", response_model=List[AccountOut])
def get_accounts(db: Session = Depends(get_db)):
    return db.query(Account).all()
