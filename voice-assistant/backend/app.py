import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(title="Voice Assistant", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

from assistant import Assistant
from memory_store import MemoryStore
from audio import AudioProcessor

assistant = Assistant()
memory = MemoryStore()
audio = AudioProcessor()

class AskRequest(BaseModel):
    text: str
    user_id: str = "default"

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "voice-assistant", "model": assistant.model}

@app.post("/api/ask")
def ask(req: AskRequest):
    ctx = memory.get_relevant_context(req.text)
    response = assistant.process(req.text, ctx)
    memory.add(f"User: {req.text}", {"role": "user"})
    memory.add(f"Assistant: {response}", {"role": "assistant"})
    return {"text": req.text, "response": response, "memory_context": bool(ctx)}

@app.post("/api/record")
def record(duration: Optional[float] = 5.0):
    text = audio.record_and_transcribe(duration)
    if not text:
        return {"text": "", "response": "Could not understand audio", "error": "stt_failed"}
    ctx = memory.get_relevant_context(text)
    response = assistant.process(text, ctx)
    memory.add(f"User: {text}", {"role": "user"})
    memory.add(f"Assistant: {response}", {"role": "assistant"})
    audio.speak(response)
    return {"text": text, "response": response, "memory_context": bool(ctx)}

@app.get("/api/memory/{user_id}")
def get_memories(user_id: str, query: Optional[str] = None):
    store = MemoryStore(user_id)
    if query:
        results = store.search(query)
    else:
        results = store.get_all()
    return {"memories": results}

@app.get("/api/history")
def get_history():
    return {"conversations": assistant.get_history()[-30:]}

@app.post("/api/clear")
def clear_history():
    assistant.clear()
    return {"status": "ok"}

static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "out")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="ui")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8004))
    print(f"Voice Assistant running at http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
