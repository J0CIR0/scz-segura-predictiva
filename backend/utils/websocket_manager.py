from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if len(self.active_connections[user_id]) == 0:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_user(self, user_id: int, message_type: str, data: dict):
        await self.send_personal_message(user_id, {
            "type": message_type,
            "data": data
        })

manager = ConnectionManager()