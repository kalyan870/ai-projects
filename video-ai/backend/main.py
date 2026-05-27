import os
import sys
import json
import uuid
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from backend.video_processor import VideoProcessor
from backend.transcriber import Transcriber
from backend.summarizer import VideoSummarizer
from backend.qa_engine import VideoQA

load_dotenv()

app = FastAPI(title="Video AI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

processor = VideoProcessor()
transcriber = Transcriber()
summarizer = VideoSummarizer()
qa_engine = VideoQA()

class QuestionRequest(BaseModel):
    video_id: str
    question: str
    time: float = None

UPLOAD_EXTENSIONS = {'.mp4', '.mov', '.mkv', '.avi', '.webm'}

@app.get("/health")
def health():
    return {"status": "ok", "service": "video-ai"}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    video_id = str(uuid.uuid4())
    video_path = os.path.join(processor.upload_dir, f"{video_id}{ext}")

    with open(video_path, "wb") as f:
        content = await file.read()
        f.write(content)

    info = processor.get_video_info(video_path)

    return {"video_id": video_id, "filename": file.filename, "info": info}

@app.post("/process/{video_id}")
def process_video(video_id: str):
    files = [f for f in os.listdir(processor.upload_dir) if f.startswith(video_id)]
    if not files:
        raise HTTPException(status_code=404, detail="Video not found")

    video_path = os.path.join(processor.upload_dir, files[0])

    audio_path = processor.extract_audio(video_path)
    frames = processor.extract_frames(video_path)
    segments = transcriber.get_timestamped_segments(audio_path)
    full_text = transcriber.get_full_text(audio_path)
    duration = processor.get_video_duration(video_path)
    chapters = summarizer.generate_chapters(full_text, duration)
    key_moments = summarizer.generate_key_moments(segments)
    summary = summarizer.generate_summary(full_text, duration)

    qa_engine.init_db()
    qa_engine.index_segments(segments, video_id)

    result = {
        "video_id": video_id,
        "duration": duration,
        "segments": segments,
        "full_text": full_text,
        "chapters": chapters,
        "key_moments": key_moments,
        "summary": summary,
        "frames": frames[:10],
    }

    with open(f"transcripts/{video_id}.json", "w") as f:
        json.dump(result, f, indent=2, default=str)

    return result

@app.get("/video/{video_id}")
def get_video_data(video_id: str):
    transcript_path = f"transcripts/{video_id}.json"
    if os.path.exists(transcript_path):
        with open(transcript_path) as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Video not processed yet")

@app.post("/ask")
def ask_question(req: QuestionRequest):
    transcript_path = f"transcripts/{req.video_id}.json"
    if not os.path.exists(transcript_path):
        raise HTTPException(status_code=404, detail="Video not processed")

    with open(transcript_path) as f:
        data = json.load(f)

    if req.time is not None:
        result = qa_engine.describe_scene(req.time, data.get("segments", []))
    else:
        result = qa_engine.answer(req.question, req.video_id, data.get("segments", []))

    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
