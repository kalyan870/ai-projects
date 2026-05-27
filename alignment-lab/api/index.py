from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Alignment Lab API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class GenerateRequest(BaseModel):
    prompt: str
    model_type: str = "sft"

@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"service": "Alignment Lab", "version": "1.0.0", "endpoints": ["/api/health", "/api/generate (POST)", "/api/train (POST)"], "note": "Full GPU training runs on Railway"}

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "alignment-lab"}

@app.post("/api/generate")
def generate(req: GenerateRequest):
    return {"prompt": req.prompt, "response": "[Alignment Lab] Deploy on Railway with GPU: railway up --service alignment-lab"}

@app.post("/api/train")
def train():
    return {"status": "ok", "message": "Training requires GPU. Deploy on Railway."}

handler = app
