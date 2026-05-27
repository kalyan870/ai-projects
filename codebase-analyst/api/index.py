from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

app = FastAPI(title="Codebase Analyst API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AskRequest(BaseModel):
    question: str
    repo_url: str = ""

@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"service": "Codebase Analyst", "version": "1.0.0", "endpoints": ["/api/health", "/api/stats", "/api/ask (POST)", "/api/load (POST)"]}

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "codebase-analyst"}

@app.get("/api/stats")
def stats():
    return {"status": "deployed", "note": "Full LanceDB indexing runs on Railway. This is a lightweight Vercel deployment."}

@app.post("/api/ask")
def ask(req: AskRequest):
    return {"answer": f"To analyze '{req.question}', deploy the full backend on Railway with 'pip install -r requirements.txt' and LanceDB.", "sources": ["deploy_full_backend_on_railway"]}

handler = app
