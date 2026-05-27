import os, json, time, hmac, hashlib, base64, uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Video AI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

STORE_ID = "wiPO3SuGPCYYU9fI"

class QuestionRequest(BaseModel):
    video_id: str = ""
    question: str = ""

class UploadRequest(BaseModel):
    url: str = ""
    filename: str = "video.mp4"

class UploadUrlRequest(BaseModel):
    filename: str = "video.mp4"
    contentType: str = "video/mp4"

def generate_client_token(pathname: str, access: str = "public", valid_until_ms: int = None) -> str:
    rw_token = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
    payload = json.dumps({"pathname": pathname, "access": access, "validUntil": valid_until_ms or int(time.time() * 1000) + 600000}, separators=(",", ":"))
    payload_b64 = base64.b64encode(payload.encode()).decode()
    signature = hmac.new(rw_token.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    combined = (signature + "." + payload_b64).encode()
    return f"vercel_blob_client_{STORE_ID}_{base64.b64encode(combined).decode()}"

@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"service": "Video AI", "version": "1.0.0", "endpoints": ["/api/health", "/api/upload-url (POST)", "/api/upload (POST)", "/api/process/{video_id} (POST)", "/api/ask (POST)"]}

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "video-ai"}

@app.post("/api/upload-url")
def upload_url(req: UploadUrlRequest):
    safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in req.filename)
    pathname = f"videos/{int(time.time()*1000)}-{safe_name}"
    client_token = generate_client_token(pathname, "public")
    return {"clientToken": client_token, "pathname": pathname}

@app.post("/api/upload")
def upload(req: UploadRequest):
    return {"video_id": str(uuid.uuid4()), "filename": req.filename, "url": req.url, "note": "Full FFmpeg + Whisper processing runs on Railway"}

@app.post("/api/process/{video_id}")
def process(video_id: str):
    sample_data = {
        "duration": 1873,
        "summary": "This is a detailed video analysis covering the main topics discussed. The video explores several key themes including technical architecture, implementation strategies, and best practices. The presenter demonstrates practical examples throughout, making complex concepts accessible.",
        "chapters": [
            {"start": 0, "end": 180, "title": "Introduction and Overview"},
            {"start": 180, "end": 540, "title": "Core Concepts and Architecture"},
            {"start": 540, "end": 900, "title": "Implementation Deep Dive"},
            {"start": 900, "end": 1260, "title": "Best Practices and Patterns"},
            {"start": 1260, "end": 1560, "title": "Real-world Examples"},
            {"start": 1560, "end": 1873, "title": "Summary and Q&A"}
        ],
        "key_moments": [
            {"time": 0, "text": "Opening remarks and agenda"},
            {"time": 180, "text": "Architecture diagram walkthrough"},
            {"time": 540, "text": "Code implementation showing the main algorithm"},
            {"time": 900, "text": "Performance optimization discussion"},
            {"time": 1260, "text": "Case study: production deployment"},
            {"time": 1560, "text": "Key takeaways and recommendations"}
        ]
    }
    return {"video_id": video_id, "status": "processing_requires_railway", "sample_data": sample_data}

@app.post("/api/ask")
def ask(req: QuestionRequest):
    return {"answer": "Full Video QA with Whisper + LanceDB runs on Railway.", "sources": []}

handler = app
