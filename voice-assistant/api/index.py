import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Voice Assistant API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AskRequest(BaseModel):
    text: str
    user_id: str = "default"

@app.get("/health")
def health():
    return {"status": "ok", "service": "voice-assistant"}

@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "voice-assistant"}

@app.post("/api/ask")
def ask(req: AskRequest):
    return {"text": req.text, "response": f"Voice Assistant: You said '{req.text}'. Full Whisper + TTS + Ollama pipeline runs on Railway with: railway up --service voice-assistant-api"}

@app.get("/api/history")
def history():
    return {"conversations": []}

handler = app
