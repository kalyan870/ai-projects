import os, sys, json, uuid, hmac, hashlib, base64, time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv

from backend.video_processor import VideoProcessor
from backend.transcriber import Transcriber
from backend.summarizer import VideoSummarizer
from backend.qa_engine import VideoQA

load_dotenv()

app = FastAPI(title="Video AI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

router = APIRouter(prefix="/api")

processor = VideoProcessor()
transcriber = Transcriber()
summarizer = VideoSummarizer()
qa_engine = VideoQA()

STORE_ID = os.environ.get("BLOB_STORE_ID", "wiPO3SuGPCYYU9fI")

class QuestionRequest(BaseModel):
    video_id: str
    question: str
    time: float = None

class UploadUrlRequest(BaseModel):
    filename: str = "video.mp4"
    contentType: str = "video/mp4"

class UrlUploadRequest(BaseModel):
    url: str = ""
    filename: str = "video.mp4"

UPLOAD_EXTENSIONS = {'.mp4', '.mov', '.mkv', '.avi', '.webm'}

@app.get("/health")
def health():
    return {"status": "ok", "service": "video-ai"}

@router.post("/upload-url")
def get_upload_url(req: UploadUrlRequest):
    rw_token = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
    ext = os.path.splitext(req.filename)[1] or ".mp4"
    pathname = f"videos/{uuid.uuid4()}{ext}"
    valid_until = int(time.time() * 1000) + 600000
    payload = json.dumps({"pathname": pathname, "access": "public", "validUntil": valid_until}, separators=(",", ":"))
    payload_b64 = base64.b64encode(payload.encode()).decode()
    signature = hmac.new(rw_token.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    combined = (signature + "." + payload_b64).encode()
    client_token = f"vercel_blob_client_{STORE_ID}_{base64.b64encode(combined).decode()}"
    return {"clientToken": client_token, "pathname": pathname}

@router.post("/upload")
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

@router.post("/process/{video_id}")
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
        "video_id": video_id, "duration": duration, "segments": segments,
        "full_text": full_text, "chapters": chapters, "key_moments": key_moments,
        "summary": summary, "frames": frames[:10],
    }
    os.makedirs("transcripts", exist_ok=True)
    with open(f"transcripts/{video_id}.json", "w") as f:
        json.dump(result, f, indent=2, default=str)
    return result

@router.post("/ask")
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

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8002, reload=True)
