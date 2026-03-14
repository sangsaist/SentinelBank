import pytest
import asyncio
import os
import sys
from httpx import AsyncClient

# Add parent directory to path to allow imports from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.core.engine import stop_engine
from app.db.database import Base, engine, SessionLocal

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.db.seed import seed_accounts
        seed_accounts(db)
    finally:
        db.close()
    yield

@pytest.fixture(scope="function", autouse=True)
async def cleanup_database():
    db = SessionLocal()
    try:
        from app.db.models import Transaction, FraudAlert
        db.query(FraudAlert).delete()
        db.query(Transaction).delete()
        db.commit()
    finally:
        db.close()
    yield

@pytest.fixture(scope="session", autouse=True)
async def ensure_engine_stopped():
    stop_engine()
    yield
    stop_engine()

from httpx import AsyncClient, ASGITransport

@pytest.fixture
async def client():
    app.state.loop = asyncio.get_running_loop()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
