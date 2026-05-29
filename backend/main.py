from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from backend.routes.auth_routes import router

app = FastAPI(title="scz segura predictiva")

app.mount("/static", StaticFiles(directory="frontend"), name="static")
app.include_router(router, prefix="/api")

@app.get("/", response_class=HTMLResponse)
def root():
    with open("frontend/index.html", "r", encoding="utf-8") as file:
        return file.read()