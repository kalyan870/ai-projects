from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

app = FastAPI(title="Video AI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class QuestionRequest(BaseModel):
    video_id: str = ""
    question: str = ""

@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"service": "Video AI", "version": "1.0.0", "endpoints": ["/api/health", "/api/upload (POST)", "/api/process/{video_id} (POST)", "/api/ask (POST)"]}

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "video-ai"}

@app.post("/api/upload")
def upload():
    return {"video_id": str(uuid.uuid4()), "filename": "sample.mp4", "note": "Full FFmpeg + Whisper processing runs on Railway"}

@app.post("/api/process/{video_id}")
def process(video_id: str):
    return {"video_id": video_id, "status": "processing_requires_railway"}

@app.post("/api/ask")
def ask(req: QuestionRequest):
    return {"answer": "Full Video QA with Whisper + LanceDB runs on Railway.", "sources": []}

handler = app
