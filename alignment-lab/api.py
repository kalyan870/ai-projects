import os
import sys
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datasets.prepare_dataset import create_preference_dataset, create_dpo_dataset
from trainers.sft_trainer import SFTTrainer
from trainers.dpo_trainer import DPOTrainerWrapper
from trainers.reward_trainer import RewardModelTrainer
from evaluations.benchmark import AlignmentBenchmark

app = FastAPI(title="Alignment Lab API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

sft_trainer = SFTTrainer()
dpo_trainer = DPOTrainerWrapper()
reward_trainer = RewardModelTrainer()
benchmark = AlignmentBenchmark()

class GenerateRequest(BaseModel):
    prompt: str
    model_type: str = "sft"
    max_length: int = 200

class TrainRequest(BaseModel):
    data_path: str = "datasets/preference_pairs.jsonl"
    model_type: str = "sft"
    epochs: int = 3

class CompareRequest(BaseModel):
    prompts: list = None

@app.get("/health")
def health():
    return {"status": "ok", "service": "alignment-lab"}

@app.post("/train")
def train_model(req: TrainRequest):
    try:
        if not os.path.exists(req.data_path):
            create_preference_dataset(req.data_path)

        if req.model_type == "sft":
            path = sft_trainer.train(req.data_path, "checkpoints/sft", req.epochs)
        elif req.model_type == "dpo":
            path = dpo_trainer.train(req.data_path, "checkpoints/dpo")
        elif req.model_type == "reward":
            path = reward_trainer.train(req.data_path, "checkpoints/reward_model", req.epochs)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model type: {req.model_type}")

        return {"status": "ok", "model_type": req.model_type, "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
def generate(req: GenerateRequest):
    try:
        if req.model_type == "sft":
            sft_trainer.model_name = "checkpoints/sft"
            sft_trainer.load_model()
            response = sft_trainer.generate(req.prompt, req.max_length)
        elif req.model_type == "dpo":
            response = dpo_trainer.generate(req.prompt, req.max_length)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model: {req.model_type}")

        return {"prompt": req.prompt, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate")
def evaluate(req: CompareRequest):
    try:
        results = benchmark.evaluate_helpfulness(
            lambda p: sft_trainer.generate(p),
            [{"prompt": p, "expected_topics": []} for p in (req.prompts or [])]
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/score")
def score_response(prompt: str, response: str):
    try:
        score = reward_trainer.score(prompt, response)
        return {"prompt": prompt, "response": response, "score": score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
