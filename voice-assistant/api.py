import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from audio.audio_handler import AudioHandler
from assistant.voice_assistant import VoiceAssistant
from memory.memory_manager import LocalMemory

app = FastAPI(title="Voice Assistant API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

audio_handler = AudioHandler()
assistant = VoiceAssistant()
memory = LocalMemory()

class AskRequest(BaseModel):
    text: str
    user_id: str = "default"

class MemoryRequest(BaseModel):
    content: str
    user_id: str = "default"

@app.get("/health")
def health():
    return {"status": "ok", "service": "voice-assistant"}

@app.post("/ask")
def ask(req: AskRequest):
    try:
        response = assistant.process_query(req.text)
        memory.add(req.user_id, f"User: {req.text}")
        memory.add(req.user_id, f"Assistant: {response}")
        return {"text": req.text, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/record")
async def record():
    try:
        audio = audio_handler.record_from_mic(5.0)
        audio_path = audio_handler.save_temp(audio)
        text = audio_handler.speech_to_text(audio_path)
        if text:
            response = assistant.process_query(text)
            audio_handler.text_to_speech(response)
            return {"text": text, "response": response}
        return {"text": "", "response": "Could not understand audio"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/memory")
def save_memory(req: MemoryRequest):
    memory.add(req.user_id, req.content)
    return {"status": "ok"}

@app.get("/memory/{user_id}")
def get_memory(user_id: str):
    return {"memories": memory.get_recent(user_id, 20)}

@app.get("/history")
def get_history():
    return {"conversations": assistant.get_history()[-50:]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
