from sqlalchemy.orm import Session
from app.db.models import Account
from faker import Faker

fake = Faker()

def seed_accounts(db: Session):
    count = db.query(Account).count()
    if count == 0:
        account_ids = list("ABCDEFGHIJKLMNOPQRST")
        accounts = []
        for aid in account_ids:
            accounts.append(Account(
                account_id=aid,
                name=fake.name(),
                balance=100000.0
            ))
        db.add_all(accounts)
        db.commit()
