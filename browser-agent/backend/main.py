import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from workflows.browser_workflow import BrowserWorkflow

load_dotenv()

app = FastAPI(title="Browser Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GoalRequest(BaseModel):
    goal: str
    user_id: str = "default"

class GoalResponse(BaseModel):
    goal: str
    plan: list
    execution: list
    screenshots: list
    summary: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "browser-agent"}

@app.post("/run", response_model=GoalResponse)
def run_agent(req: GoalRequest):
    try:
        workflow = BrowserWorkflow()
        result = workflow.run(req.goal, req.user_id)
        workflow.close()
        return GoalResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract")
def extract_data(req: GoalRequest):
    try:
        workflow = BrowserWorkflow()
        result = workflow.run(req.goal, req.user_id)
        workflow.close()
        return {"data": result["execution"], "summary": result["summary"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/{user_id}")
def get_memory(user_id: str):
    from memory.memory_manager import MemoryManager
    mm = MemoryManager()
    return {"memories": mm.get_all(user_id)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
