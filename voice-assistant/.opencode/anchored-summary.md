## Goal
- Build a local-first offline voice assistant with memory using Ollama, Whisper, and mem0.

## Constraints & Preferences
- Runs entirely offline with no cloud dependencies
- Uses Ollama (llama3.2) for local LLM inference
- Speech-to-text via openai-whisper
- Text-to-speech via pyttsx3
- Persistent memory via mem0 with Qdrant vector store
- Frontend built with Next.js 14, statically exported and served by FastAPI backend
- Backend serves both API and UI on a single port (8004)

## Progress
### Done
- Ollama 0.6.2 verified working with llama3.2 (3.2B Q4_K_M) and qwen2.5-coder:7b models
- Installed all core dependencies: fastapi, uvicorn, ollama, sounddevice, numpy, scipy, openai-whisper, pyttsx3, mem0ai
- Rewrote `backend/app.py` — FastAPI server with `/health`, `/ask`, `/record`, `/memory/{user_id}`, `/history`, `/clear` endpoints
- Rewrote `backend/assistant.py` — Ollama chat with 50-turn conversation history and memory context injection
- Rewrote `backend/memory_store.py` — mem0 with Qdrant vector store for persistent memory
- Rewrote `backend/audio.py` — whisper.transcribe() for STT, pyttsx3 for TTS, sounddevice for mic recording
- Built `frontend/` — Next.js 14 chat UI with mic button, text input, send, memory panel toggle, status indicator
- Backend serves UI at http://localhost:8004, API at /ask, /record, /memory, /history, /clear
- Verified end-to-end: LLM returns real Ollama responses, memory persists across conversations

### In Progress
- (none)

### Known Issues
- pyaudio failed to install (no C++ build tools on Windows) — replaced with sounddevice
- mem0 + Qdrant occasionally locks vector store on concurrent restarts — fixed with JSON-based fallback memory
- Vercel deployment abandoned — tool is local-first by design (requires Ollama on same machine)

## Key Decisions
- Used sounddevice instead of pyaudio (installs cleanly on Windows without build tools)
- Used openai-whisper (base model) for STT instead of Whisper.cpp (avoids separate binary build)
- Used mem0 over custom SQLite memory (provides semantic search and automatic embeddings via Ollama)
- FastAPI serves the built Next.js static export for single-port self-contained operation
- Frontend API URL defaults to localhost:8004 with NEXT_PUBLIC_API_URL override

## Next Steps
- Verify end-to-end voice pipeline: record → transcribe → LLM → TTS → play
- Add wake word detection (Porcupine/OpenWakeWord) for hands-free activation
- Create a one-click launcher script (start.bat / start.ps1)

## Relevant Files
- `backend/app.py` — FastAPI server: all API endpoints + static frontend serving
- `backend/assistant.py` — Ollama chat with system prompt, history, memory injection
- `backend/memory_store.py` — mem0 wrapper with Qdrant vector store
- `backend/audio.py` — AudioProcessor: record(), transcribe(), save_wav(), speak()
- `frontend/src/app/page.tsx` — Next.js chat UI with mic button, message history, memory panel
- `frontend/next.config.js` — Static export config
- `frontend/vercel.json` — Deploy config (Vercel deployment on hold)
- `start.ps1` — Quick launcher script

## Run Commands
```powershell
# Start backend
python backend/app.py
# Open http://localhost:8004
```
