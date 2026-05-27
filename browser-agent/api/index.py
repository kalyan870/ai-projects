import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Browser Agent API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class GoalRequest(BaseModel):
    goal: str
    user_id: str = "default"

@app.get("/health")
def health():
    return {"status": "ok", "service": "browser-agent"}

@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "browser-agent"}

@app.get("/api")
def root():
    return {"service": "Browser Agent", "version": "1.0.0"}

@app.post("/api/run")
def run_agent(req: GoalRequest):
    return {
        "goal": req.goal,
        "plan": [{"action": "navigate", "params": {"url": "https://google.com"}}, {"action": "search_google", "params": {"query": req.goal}}],
        "execution": [{"action": "planned", "params": {}, "result": "Full Playwright automation requires Railway deployment"}],
        "screenshots": [],
        "summary": f"Full browser automation for '{req.goal}' requires Railway deployment with Playwright. Deploy with: cd backend && railway up --service browser-agent-api"
    }

@app.post("/api/extract")
def extract(req: GoalRequest):
    return {"data": [], "summary": "Full extraction with Playwright runs on Railway"}

handler = app
