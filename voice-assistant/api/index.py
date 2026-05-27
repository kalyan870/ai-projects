from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Voice Assistant API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AskRequest(BaseModel):
    text: str
    user_id: str = "default"

@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"service": "Voice Assistant", "version": "1.0.0", "endpoints": ["/api/health", "/api/ask (POST)", "/api/history", "/api/memory (POST)"]}

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "voice-assistant"}

@app.post("/api/ask")
def ask(req: AskRequest):
    return {"text": req.text, "response": f"Voice Assistant: You said '{req.text}'. Full pipeline runs on Railway."}

@app.get("/api/history")
def history():
    return {"conversations": []}

handler = app
