from fastapi import APIRouter, Request, HTTPException
from app.core.injector import inject_fraud, SCENARIOS
from app.websocket.manager import get_broadcast_fn

router = APIRouter()

@router.post("/inject/{scenario_number}")
def post_inject(scenario_number: int, request: Request):
    if scenario_number not in SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    broadcast_fn = get_broadcast_fn(request.app.state.loop)
    inject_fraud(scenario_number, broadcast_fn)
    
    return {
        "injecting": True, 
        "scenario": scenario_number, 
        "name": SCENARIOS[scenario_number]["name"]
    }
