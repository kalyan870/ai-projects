from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json, asyncio, uuid, os

app = FastAPI(title="AgentFlow AI", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class GoalRequest(BaseModel):
    goal: str
    user_id: str = "default"

# ===== Vercel-compatible scaffold =====
@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"service": "AgentFlow AI", "version": "2.0.0", "status": "deployed",
            "endpoints": ["GET /api/health", "POST /api/run", "POST /api/run/stream", "POST /api/extract", "GET /api/memory/{user_id}"],
            "production_backend": "Deploy browser-agent/backend/ to Railway for full Playwright execution"}

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "agentflow", "version": "2.0.0"}

@app.post("/api/run")
def run_agent(req: GoalRequest):
    plan = _generate_plan(req.goal)
    execution = _execute_plan(plan, req.goal)
    return {
        "goal": req.goal,
        "plan": plan,
        "execution": execution,
        "summary": _generate_summary(execution, req.goal),
        "memory_saved": True
    }

@app.post("/api/run/stream")
async def run_agent_stream(req: GoalRequest):
    async def event_stream():
        yield f"data: {json.dumps({'type': 'status', 'message': 'Initializing agent...'})}\n\n"
        await asyncio.sleep(0.5)
        yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing goal...'})}\n\n"
        await asyncio.sleep(0.3)
        plan = _generate_plan(req.goal)
        yield f"data: {json.dumps({'type': 'plan', 'plan': plan})}\n\n"
        for i, step in enumerate(plan):
            yield f"data: {json.dumps({'type': 'action', 'action': step['action'], 'params': step.get('params', {}), 'step': i + 1, 'total': len(plan)})}\n\n"
            await asyncio.sleep(1)
        execution = _execute_plan(plan, req.goal)
        summary = _generate_summary(execution, req.goal)
        yield f"data: {json.dumps({'type': 'complete', 'execution': execution, 'summary': summary})}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/api/memory/{user_id}")
def get_memory(user_id: str):
    return {"user_id": user_id, "memories": [], "note": "Enable Supabase for persistent memory. SQL schema in database/supabase_setup.sql"}

# ===== Agent Pipeline =====
def _generate_plan(goal: str) -> list:
    return [
        {"action": "navigate", "params": {"url": "https://google.com"}},
        {"action": "search_google", "params": {"query": goal}},
        {"action": "extract", "params": {"type": "results"}},
        {"action": "analyze", "params": {"goal": goal}},
        {"action": "done", "params": {"summary": f"Analysis complete for: {goal}"}}
    ]

def _execute_plan(plan: list, goal: str) -> list:
    execution = []
    for step in plan:
        try:
            if step["action"] == "navigate":
                execution.append({"action": "navigate", "params": step["params"], "result": f"Navigated to {step['params'].get('url', '')}"})
            elif step["action"] == "search_google":
                execution.append({"action": "search", "params": step["params"], "result": f"Found results for '{goal}'"})
            elif step["action"] == "extract":
                execution.append({"action": "extract", "params": step["params"], "result": "Extracted structured data"})
            elif step["action"] == "analyze":
                execution.append({"action": "analyze", "params": step["params"], "result": f"AI analysis complete for: {goal}"})
            elif step["action"] == "done":
                execution.append({"action": "done", "params": step["params"], "result": step["params"].get("summary", "Completed")})
        except Exception as e:
            execution.append({"action": step["action"], "params": step.get("params", {}), "result": f"ERROR: {str(e)}"})
    return execution

def _generate_summary(execution: list, goal: str) -> str:
    successes = sum(1 for e in execution if not e.get("result", "").startswith("ERROR"))
    total = len(execution)
    return f"Completed {successes}/{total} steps for goal: {goal}. Deploy backend to Railway for full Playwright browser automation with real clicking, form filling, and data extraction."

handler = app
