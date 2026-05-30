from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from backend.routes.auth_routes import router as auth_router
from backend.routes.incidente_routes import router as incidente_router
from backend.routes.admin_routes import router as admin_router

app = FastAPI(title="SCZ Segura Predictiva")

app.mount("/static", StaticFiles(directory="frontend"), name="static")

app.include_router(auth_router, prefix="/api")
app.include_router(incidente_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.get("/", response_class=HTMLResponse)
def root():
    with open("frontend/index.html", "r", encoding="utf-8") as file:
        return file.read()