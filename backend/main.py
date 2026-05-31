from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import auth_routes, incidente_routes, admin_routes, policia_routes
from backend.utils.auth_utils import auth_service
from backend.utils.websocket_manager import manager
import pathlib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api", tags=["auth"])
app.include_router(incidente_routes.router, prefix="/api", tags=["incidentes"])
app.include_router(admin_routes.router, prefix="/api", tags=["admin"])
app.include_router(policia_routes.router, prefix="/api", tags=["policia"])

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    user_payload = None
    try:
        user_payload = auth_service.get_current_user_optional(token)
        if not user_payload:
            await websocket.close(code=1008)
            return
        
        user_id = user_payload.get("id")
        if not user_id:
            await websocket.close(code=1008)
            return
        
        await manager.connect(user_id, websocket)
        
        try:
            while True:
                data = await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(user_id, websocket)
    except Exception as e:
        if websocket:
            await websocket.close(code=1011)

frontend_path = pathlib.Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")
    
    @app.get("/")
    async def root():
        from fastapi.responses import FileResponse
        index_path = frontend_path / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return {"mensaje": "SCZ Segura Predictiva API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}