from fastapi import APIRouter, Request
from app.core.engine import engine_state, start_engine, stop_engine, pause_engine, resume_engine
from app.websocket.manager import get_broadcast_fn
from app.schemas.schemas import EngineStatusOut

router = APIRouter(prefix="/engine")

@router.post("/start", response_model=EngineStatusOut)
def post_engine_start(request: Request):
    broadcast_fn = get_broadcast_fn(request.app.state.loop)
    start_engine(broadcast_fn)
    return engine_state

@router.post("/stop", response_model=EngineStatusOut)
def post_engine_stop():
    stop_engine()
    return engine_state

@router.post("/pause", response_model=EngineStatusOut)
def post_engine_pause():
    pause_engine()
    return engine_state

@router.post("/resume", response_model=EngineStatusOut)
def post_engine_resume(request: Request):
    broadcast_fn = get_broadcast_fn(request.app.state.loop)
    resume_engine(broadcast_fn)
    return engine_state

@router.get("/status", response_model=EngineStatusOut)
def get_engine_status():
    return engine_state
