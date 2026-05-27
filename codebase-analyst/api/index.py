import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Codebase Analyst API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AskRequest(BaseModel):
    question: str
    repo_url: str = ""

@app.get("/health")
def health():
    return {"status": "ok", "service": "codebase-analyst"}

@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "codebase-analyst"}

@app.get("/api")
def root():
    return {"service": "Codebase Analyst", "version": "1.0.0"}

@app.get("/api/stats")
def stats():
    return {"status": "deployed", "note": "Full LanceDB indexing runs on Railway. This is a lightweight Vercel deployment."}

@app.post("/api/ask")
def ask(req: AskRequest):
    return {"answer": f"To analyze '{req.question}', deploy the full backend on Railway with 'pip install -r requirements.txt' and LanceDB. This Vercel deployment provides the API scaffold.", "sources": ["deploy_full_backend_on_railway"]}

handler = app
