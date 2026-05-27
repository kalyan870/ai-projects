import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Alignment Lab API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class GenerateRequest(BaseModel):
    prompt: str
    model_type: str = "sft"

@app.get("/health")
def health():
    return {"status": "ok", "service": "alignment-lab"}

@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "alignment-lab"}

@app.get("/api")
def root():
    return {"service": "Alignment Lab", "version": "1.0.0", "note": "Full GPU training runs on Railway/AWS. API scaffold for Vercel deployment."}

@app.post("/api/generate")
def generate(req: GenerateRequest):
    return {"prompt": req.prompt, "response": f"[Alignment Lab] To train and run models, deploy the full backend on Railway with GPU support. This Vercel deployment provides the API scaffold."}

@app.post("/api/train")
def train():
    return {"status": "ok", "message": "Training requires GPU. Deploy on Railway with: railway up --service alignment-lab"}

handler = app
