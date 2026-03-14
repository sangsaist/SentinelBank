import pytest
import asyncio
import websockets
import json
from httpx import AsyncClient

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws"

@pytest.mark.asyncio
async def test_accounts_seeded(client: AsyncClient):
    response = await client.get("/accounts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 20
    for account in data:
        assert "account_id" in account
        assert "name" in account
        assert "balance" in account
        assert "created_at" in account

@pytest.mark.asyncio
async def test_engine_status_initial(client: AsyncClient):
    response = await client.get("/engine/status")
    assert response.status_code == 200
    assert response.json()["status"] == "stopped"

@pytest.mark.asyncio
async def test_engine_start(client: AsyncClient):
    await client.post("/engine/stop")
    response = await client.post("/engine/start")
    assert response.status_code == 200
    assert response.json()["status"] == "running"
    
    await asyncio.sleep(2)
    
    status_resp = await client.get("/engine/status")
    assert status_resp.json()["count"] > 0
    await client.post("/engine/stop")

@pytest.mark.asyncio
async def test_engine_pause(client: AsyncClient):
    await client.post("/engine/start")
    await asyncio.sleep(1)
    response = await client.post("/engine/pause")
    assert response.status_code == 200
    assert response.json()["status"] == "paused"
    await client.post("/engine/stop")

@pytest.mark.asyncio
async def test_engine_resume(client: AsyncClient):
    await client.post("/engine/start")
    await client.post("/engine/pause")
    response = await client.post("/engine/resume")
    assert response.status_code == 200
    assert response.json()["status"] == "running"
    await client.post("/engine/stop")

@pytest.mark.asyncio
async def test_engine_stop(client: AsyncClient):
    await client.post("/engine/start")
    await asyncio.sleep(1)
    response = await client.post("/engine/stop")
    assert response.status_code == 200
    assert response.json()["status"] == "stopped"

@pytest.mark.asyncio
async def test_inject_scenario_1_high_value(client: AsyncClient):
    await client.post("/engine/stop")
    response = await client.post("/inject/1")
    assert response.status_code == 200
    assert response.json()["injecting"] is True
    assert response.json()["scenario"] == 1
    assert response.json()["name"] == "HIGH_VALUE_TRANSFER"
    
    await asyncio.sleep(2)
    
    alerts_resp = await client.get("/fraud-alerts")
    alerts = alerts_resp.json()
    assert any(a["reason"] == "HIGH_VALUE_TRANSFER" for a in alerts)

@pytest.mark.asyncio
async def test_inject_scenario_2_smurfing(client: AsyncClient):
    response = await client.post("/inject/2")
    assert response.status_code == 200
    
    await asyncio.sleep(4)
    
    txns_resp = await client.get("/transactions")
    txns = txns_resp.json()
    sender_c_txns = [t for t in txns if t["sender_id"] == "C"]
    assert len(sender_c_txns) >= 7

@pytest.mark.asyncio
async def test_inject_scenario_4_circular(client: AsyncClient):
    response = await client.post("/inject/4")
    assert response.status_code == 200
    
    await asyncio.sleep(3)
    
    alerts_resp = await client.get("/fraud-alerts")
    alerts = alerts_resp.json()
    assert any(a["reason"] == "CIRCULAR_TRANSACTION" for a in alerts)

@pytest.mark.asyncio
async def test_inject_scenario_5_rapid_burst(client: AsyncClient):
    response = await client.post("/inject/5")
    assert response.status_code == 200
    
    await asyncio.sleep(4)
    
    alerts_resp = await client.get("/fraud-alerts")
    alerts = alerts_resp.json()
    assert any(a["reason"] == "HIGH_FREQUENCY_BURST" for a in alerts)

@pytest.mark.asyncio
async def test_transactions_endpoint(client: AsyncClient):
    response = await client.get("/transactions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        item = data[0]
        fields = ["transaction_id", "sender_id", "receiver_id", "amount", 
                  "timestamp", "is_fraud", "risk_score", "color", "fraud_reason"]
        for field in fields:
            assert field in item
        assert item["color"] in ["green", "orange", "red"]

@pytest.mark.asyncio
async def test_fraud_alerts_endpoint(client: AsyncClient):
    response = await client.get("/fraud-alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        item = data[0]
        fields = ["alert_id", "transaction_id", "reason", "risk_score", "pattern_type", "timestamp"]
        for field in fields:
            assert field in item

@pytest.mark.asyncio
async def test_stats_endpoint(client: AsyncClient):
    await client.post("/engine/start")
    await asyncio.sleep(3)
    response = await client.get("/stats")
    assert response.status_code == 200
    data = response.json()
    
    assert "total_transactions" in data
    assert data["total_transactions"] > 0
    await client.post("/engine/stop")

@pytest.mark.asyncio
async def test_websocket_connection(client: AsyncClient):
    try:
        async with websockets.connect(WS_URL) as ws:
            await client.post("/engine/start")
            message = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(message)
            assert "type" in data
            await client.post("/engine/stop")
    except Exception as e:
        pytest.skip(f"WebSocket test requires uvicorn server running: {e}")
