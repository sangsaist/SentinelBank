import asyncio
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections = set()

    async def connect(self, websocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        message_str = json.dumps(message)
        to_remove = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception:
                to_remove.append(connection)
        for connection in to_remove:
            self.disconnect(connection)

manager = ConnectionManager()

def get_broadcast_fn(loop):
    def broadcast_fn(msg: dict):
        if loop and loop.is_running():
            try:
                asyncio.run_coroutine_threadsafe(manager.broadcast(msg), loop)
            except RuntimeError:
                # Handle cases where the loop closed between check and call
                pass
    return broadcast_fn
