import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, get_db
from app.db.seed import seed_accounts
from app.api import accounts, engine_routes, injector_routes, transactions
from app.websocket.manager import manager
from app.core.engine import stop_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    db_gen = get_db()
    db = next(db_gen)
    seed_accounts(db)
    app.state.loop = asyncio.get_running_loop()
    yield
    # Shutdown
    stop_engine()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(accounts.router, tags=["Accounts"])
app.include_router(engine_routes.router, tags=["Engine"])
app.include_router(injector_routes.router, tags=["Injector"])
app.include_router(transactions.router, tags=["Transactions"])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
