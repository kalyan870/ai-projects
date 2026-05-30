 kalyan870 / ai-projects
Autonomous agents · Multimodal video intelligence · AI safety research · Local voice AI · Deep code analysis

   

      

Live Demos ↗  ·  Architecture  ·  Quick Start  ·  Roadmap



The Philosophy
Most AI demos are wrappers. These are engineered systems.

Every project here is a complete, production-deployed pipeline — with memory layers, streaming backends, vector databases, multi-model inference, and real frontends. Not notebooks. Not demos.

This portfolio covers:

Agentic AI — browser automation with reasoning loops and persistent memory
Multimodal Intelligence — video QA spanning vision, audio, and temporal reasoning
AI Safety Engineering — bias detection, alignment scoring, adversarial testing
Local-First AI — fully offline voice assistant with Whisper STT + Ollama LLMs
Code Intelligence — semantic codebase indexing with RAG + streaming responses


📦 Projects at a Glance
#
Project
Core Function
Key Tech
Live
01
Browser Agent
Autonomous web navigation
Next.js · FastAPI · Playwright · mem0
↗
02
Codebase Analyst
Deep code Q&A & review
Next.js · FastAPI · ChromaDB · Redis
↗
03
Alignment Lab
AI bias & safety evaluation
TruLens · DeepEval · LangSmith · Ragas
↗
04
Voice Assistant
Offline voice AI with memory
Ollama · Whisper · mem0 · Coqui TTS
↗
05
Multimodal Video AI
Video Q&A & summarisation
FFmpeg · Whisper · LanceDB · vLLM
↗



🎬 Live Demos
Demo videos recorded from actual running systems.

Project
Demo Video
Architecture
Browser Agent
browser_agent_demo.mp4
agent_bvrowser_architechure.png
Codebase Analyst
codebase_analyst_demo.mp4
code_base_project_architechure.png
Alignment Lab
alignment_lab_demo.mp4
alignment_tab_flow_chart.png
Voice Assistant
voice_assistant_demo.mp4
voice_assistat_flow_chart.png
Multimodal Video AI
multivideo_demo_v2.mp4
flow_chart_for_multi_model_vedio.png



🧠 System Architecture
╔══════════════════════════════════════════════════════════════════════════════╗

║                         AI PROJECTS ECOSYSTEM                               ║

║                                                                              ║

║  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────┐    ║

║  │  BROWSER AGENT   │   │ CODEBASE ANALYST │   │   ALIGNMENT LAB      │    ║

║  │                  │   │                  │   │                      │    ║

║  │ Next.js Frontend │   │ Next.js + FastAPI │   │ Next.js + FastAPI    │    ║

║  │ FastAPI Backend  │   │ Git Clone → AST  │   │ Multi-LLM Inference  │    ║

║  │ Playwright Engine│   │ Chunk → Embed    │   │ TruLens / DeepEval   │    ║

║  │ mem0 Memory      │   │ ChromaDB / Redis │   │ Bias · Align · Red   │    ║

║  │ Qdrant VectorDB  │   │ Streaming SSE    │   │ Team Adversarial     │    ║

║  └────────┬─────────┘   └────────┬─────────┘   └──────────┬───────────┘    ║

║           │                      │                          │                ║

║           └──────────────────────┼──────────────────────────┘                ║

║                                  ▼                                           ║

║                    ┌─────────────────────────┐                              ║

║                    │   Multi-Model LLM Layer  │                              ║

║                    │  Claude · OpenAI · Ollama│                              ║

║                    │  Mistral · Groq · Gemini │                              ║

║                    └────────────┬────────────┘                              ║

║                                  │                                           ║

║             ┌────────────────────┼────────────────────┐                     ║

║             ▼                    ▼                     ▼                     ║

║  ┌──────────────────┐   ┌──────────────────┐  ┌──────────────────┐         ║

║  │  VOICE ASSISTANT │   │  VIDEO AI        │  │  SHARED INFRA    │         ║

║  │                  │   │                  │  │                  │         ║

║  │ Ollama (Local)   │   │ FFmpeg Processor  │  │ Vector DBs       │         ║

║  │ Whisper STT      │   │ Whisper STT       │  │ (Qdrant/Chroma/  │         ║

║  │ Coqui/Piper TTS  │   │ LanceDB + vLLM   │  │  LanceDB/Pine)   │         ║

║  │ mem0 Persistent  │   │ MVU/HunyuanVideo  │  │ Redis Cache      │         ║

║  │ FastAPI Local    │   │ Frame Embeddings  │  │ PostgreSQL       │         ║

║  └──────────────────┘   └──────────────────┘  └──────────────────┘         ║

║                                                                              ║

║                        Deployed on Vercel                                    ║

╚══════════════════════════════════════════════════════════════════════════════╝


🚀 Projects Deep-Dive
01 · Browser Agent
An AI agent that browses the web, understands pages, takes actions, and completes tasks autonomously.

  

Full System Flow & Architecture 

Pipeline — 8-Stage Autonomous Loop:

[1] User Input (natural language task)

        │

        ▼

[2] Next.js Frontend — Chat UI · Real-time Updates · Task Status · Results Preview

        │  API Request (WebSocket / REST)

        ▼

[3] FastAPI Backend — Task Orchestrator · Session Management · Tool Execution · Streaming

        │

        ▼

[4] Browser Agent Engine (Playwright)

        │  Navigate · Click · Fill/Type · Scroll · Select · Screenshot · Go Back/Forward

        ▼

[5] Page Snapshot & Extraction

        │  DOM (Accessibility Tree) · Text Content · Elements & Attributes

        │  Links & Metadata · Screenshot

        ▼

[6] AI Planner (LLM)

        │  Understand Goal → Analyze Snapshot → Decide Next Action → Reason & Plan Steps

        │  Example actions: click(@search_button), fill(@from_input, "Mumbai")

        ▼

[7] Action Execution Loop  ←──────────────────────────────────┐

        │  Execute Action → Observe Result → Update Context    │

        │  Check Goal Progress ─────────────────────────────── ┘

        │  (repeat until task complete)

        ▼

[8] Final Result — Structured data returned to user

Memory & Context Layer:

Short-term (session): Current goal · Recent actions · Page snapshots · Intermediate results
Long-term (mem0 + Vector DB): User preferences · Past tasks · Learned patterns · Saved information
Knowledge Base (optional): FAQs · Guides · Domain data · Custom docs

Tech Stack:

Layer
Technology
Frontend
Next.js · Tailwind CSS
Backend
FastAPI (Python)
Browser
Playwright
LLM / AI
OpenAI · Claude · Ollama
Memory
mem0 · Qdrant · Chroma
Hosting
Vercel
Database
PostgreSQL / MongoDB (optional)


Real-World Use Cases:

Flight / hotel booking automation
Form filling & submission
Web research & competitive scraping
E-commerce automation
QA / testing automation
Data extraction pipelines


02 · Codebase Analyst
AI-powered code understanding — ask anything about any codebase in natural language.

  

Full System Flow & Architecture 

7-Stage Processing Pipeline:

[1] User Input

        │  Upload codebase OR enter GitHub/GitLab URL → Ask a question

        ▼

[2] Next.js Frontend

        │  Chat Interface · File Explorer · Analysis Results · Code Viewer · Insights Dashboard

        │  API Request → FastAPI Backend

        ▼

[3] FastAPI Backend — Request Handler · Auth · Rate Limiting · Job Orchestrator · WebSocket/SSE

        │

        ▼

[4] Code Processing Pipeline

        │  Clone/Read Codebase (git clone or uploaded files)

        │       ↓

        │  File Parsing (read files, detect language, extract code structure)

        │       ↓

        │  Chunking (split into meaningful chunks: functions, classes, files)

        │       ↓

        │  Indexing (create embeddings → store in vector database)

        ▼

[5] AI Analysis Engine (Claude / OpenAI / Gemini / Ollama)

        │  Understand Codebase · Answer Questions · Find Dependencies

        │  Explain Code · Generate Summaries · Suggest Improvements · Detect Bugs

        ▼

[6] Response & Insights

        │  Natural Language Answer · Code Snippets · File References

        │  Diagrams / Structure · Recommendations · Related Files

        ▼

[7] Frontend Update (Real-time Streaming)

        │  Streamed Answer · Highlighted Code · File Links

           Visualizations (Architecture / Graph) · Conversation History

Memory & Context: Conversation history · User preferences · Codebase context · Previously indexed data · Saved analyses

Tech Stack:

Layer
Technology
Frontend
Next.js · React · Tailwind CSS
Backend
FastAPI (Python)
LLM / AI
OpenAI · Claude · Gemini · Ollama
Vector DB
ChromaDB · Pinecone · Qdrant
File Storage
Local Storage · S3 · Vercel Blob
Cache
Redis / Upstash
Git Providers
GitHub API · GitLab API
Other Tools
Git · Docker · LangChain · Tiktoken · Tree-sitter
Deployment
Vercel


Use Cases:

Understand large codebases quickly
Find and explain any function / file
Analyze dependencies and structure
Refactor and improvement suggestions
Debug issues and find root causes
Generate documentation and summaries


03 · Alignment Lab
Research-grade AI evaluation — from bias detection to LLM alignment scoring and adversarial red-teaming.

  

Full System Flow & Architecture 

7-Stage Evaluation Pipeline:

[1] User Input

        │  Enter Prompt/Dataset · Select Model(s) · Choose Eval Framework

        │  Select Bias/Risk Categories · Run Evaluation

        ▼

[2] Initial Processing

        │  Input Validation & Sanitization → Prompt/Data Preprocessing

        │  Dataset Structuring → Task Understanding & Routing

        ▼

[3] Parallel Evaluation Modules

        │

        ├─► [3A] Multi-Model Inference

        │       Generate responses: OpenAI · Anthropic · Mistral · Llama/Ollama · Groq · Custom

        │

        ├─► [3B] Bias & Risk Detection

        │       Detect: Fairness · Toxicity · Stereotype · Harmfulness · Privacy · Misinformation

        │

        ├─► [3C] Alignment & Scoring Engine

        │       Metrics: Helpfulness · Honesty · Harmlessness · Fairness · Robustness · Consistency

        │

        └─► [3D] Adversarial & Stress Testing

                Test types: Jailbreak · Prompt Injection · Red Teaming · Adversarial · Edge Cases

        ▼

[4] Results Aggregation

        │  Collect All Responses → Aggregate Bias & Risk → Compute Alignment Scores

        │  Compare Across Models → Generate Insights & Recommendations

        ▼

[5] Outputs & Visualizations

        │  Alignment Score Dashboard · Bias Analysis Reports · Model Comparison View

        │  Risk Heatmaps · Detailed Logs & Traces · Download / Export Results

        ▼

[6] Feedback & Improvement Loop

        │  Review → Identify Issues → Refine Prompts → Re-run → Track Improvements

        ▼

[7] Storage & History

           Store Evaluations · Save Configurations · Track Experiments · Audit Logs

Supported Evaluation Frameworks: TruLens · DeepEval · LangSmith · Ragas · Custom

Tech Stack:

Layer
Technology
Frontend
Next.js / React
Backend
FastAPI (Python)
LLM APIs
OpenAI · Anthropic · Mistral · Llama · Groq (Multi-provider)
Eval Frameworks
TruLens · DeepEval · LangSmith · Ragas
Embeddings
OpenAI / HuggingFace
Vector DB
Pinecone / Chroma (optional)
Database
PostgreSQL
Cache / Queue
Redis · Celery



04 · Voice Assistant
100% local, offline-capable voice AI with persistent memory — private by design.

  

Full System Flow & Architecture 

8-Stage Local AI Pipeline:

[1] User Input — Text Message OR Voice Input (microphone)

        │

        ▼

[2] Next.js Frontend

        │  Chat Interface · Voice Recorder · Real-time UI Updates · Memory Indicator

        │  HTTP/API Request

        ▼

[3] FastAPI Backend (localhost:8004)

        │  Request Handler · Session Management · Auth (local) · Streaming Responses · Voice Processing API

        │

        ├──────────────────────────────────────┐

        ▼                                      ▼

[4] AI Engine (Ollama — Local LLM)     [6] Voice Processing Pipeline

        │  llama3.2 · mistral · phi3            │  Voice → Whisper STT → Faster-Whisper

        │  Prompt Processing                    │  Response → Coqui TTS / Piper → Audio

        │  Context Understanding                │  (all local, no cloud)

        │  Response Generation                  │

        │  Function Calling (if any)            │

        ▼                                      ▼

[5] Memory Layer (mem0)

        │  User Facts · Chat History · Preferences · Context

        │  Add Memory · Retrieve Relevant Context · Long-term Persistence

        ▼

[7] Response Output

        │  Text Response (shown in chat) + Voice Response (played automatically)

        │  Real-time streaming

        ▼

[8] Supporting Infrastructure

           SQLite/JSON Storage · Faster-Whisper · Coqui TTS · Ollama Service · mem0 Vector DB

Key Properties:

100% Local & Offline — no data leaves your machine
Memory-enabled — remembers you across sessions via mem0
Voice + Text — switch between modalities seamlessly
Privacy focused — zero cloud dependencies
Real-time streaming — token-by-token response

Tech Stack:

Layer
Technology
Frontend
Next.js · Tailwind CSS
Backend
FastAPI (Python) · localhost:8004
LLM
Ollama (llama3.2 · mistral · phi3 · tinyllama)
STT
Faster-Whisper (local)
TTS
Coqui TTS / Piper (local)
Memory
mem0 · Vector DB (local)
Storage
SQLite / JSON / Local Storage



05 · Multimodal Video AI
Ask anything about any video — transcription, visual understanding, and timestamp-grounded QA.

  

Full System Flow & Architecture 

9-Stage Multimodal Pipeline:

[1] Video Input — MP4 / MOV / MKV (drag & drop or browse)

        │

        ▼

[2] Video Processing (FFmpeg)

        ├──► Extract Audio

        ├──► Extract Frames

        └──► Generate Timestamps

        │

        ├────────────────────────────────────────────────┐

        ▼                                                ▼

[3] Speech-to-Text (Whisper)              [4B] Visual Understanding

        │  Audio → Text transcript              │  MVU / HunyuanVideo

        ▼                                      │  Understand scenes, objects, actions

[4A] Transcript Chunking                       ▼

        │  Split into segments         [4C] Timestamp Mapping

        │  with timestamps                   Map frames + transcript → exact timestamps

        ▼                                        │

[5A] Transcript Embeddings                      ▼

        │  Embed each segment          [5B] Frame Embeddings

        │                                    Embed each key visual frame

        └───────────────────┬────────────────────┘

                            ▼

[6] Vector Storage (LanceDB)

        │  Store Transcript Embeddings · Frame Embeddings · Metadata (timestamps, text)

        ▼

[7] Retrieval & QA Engine

        │  User Query → Retrieve Relevant Content (top-k transcript + frames)

        │  → vLLM Multimodal Reasoning → Generate Answer / Summary

        ▼

[8] Output Generation

        │  Video Playback (synced) · AI Summary · AI Highlights

        │  Keyframe Viewer · Transcript Viewer · Q&A / Chat

        ▼

[9] User Interface Dashboard

           Upload · Timeline · Semantic Search · Ask About This Video

           Export (summary, transcript, etc.) · Model Status

Tech Stack:

Layer
Technology
Video Processing
FFmpeg
Speech-to-Text
Whisper (OpenAI)
Visual Understanding
MVU / HunyuanVideo
LLM Inference
vLLM (multimodal)
Vector Database
LanceDB
Language
Python
Frontend
React Dashboard


Output Capabilities:

Watch video with AI-synced timestamp navigation
Ask questions grounded to specific moments
Exportable: summary · full transcript · highlights


🛠 Quick Start
Prerequisites
node >= 18.0.0

python >= 3.10

git

ollama  # for voice-assistant (local LLM)

ffmpeg  # for video-ai
Clone & Setup
git clone https://github.com/kalyan870/ai-projects.git

cd ai-projects

Browser Agent / Codebase Analyst / Alignment Lab / Video AI (Python backend)

cd <project-folder>

pip install -r requirements.txt

cp .env.example .env   # fill in your keys

uvicorn main:app --reload

Voice Assistant (local Ollama)

# Install Ollama: https://ollama.com

ollama pull llama3.2

cd voice-assistant

pip install -r requirements.txt

uvicorn main:app --port 8004

Any Frontend (Next.js)

cd <project-folder>/frontend

npm install

npm run dev
Environment Variables
# Claude / OpenAI (for cloud projects)

ANTHROPIC_API_KEY=your_key_here

OPENAI_API_KEY=your_key_here

# Vector DB (optional — falls back to in-memory)

PINECONE_API_KEY=your_key_here

QDRANT_URL=http://localhost:6333

# Cache (optional)

REDIS_URL=redis://localhost:6379

# Voice Assistant (local — no keys needed for Ollama)

OLLAMA_BASE_URL=http://localhost:11434

Cloud LLM keys: console.anthropic.com · platform.openai.com Local LLM (free): ollama.com


📁 Repository Structure
ai-projects/

│

├── browser-agent/                  # Autonomous web navigation agent

│   ├── frontend/                   # Next.js · Tailwind CSS

│   ├── backend/                    # FastAPI · Playwright · mem0

│   │   ├── agent/                  # Planner · Executor · Vision

│   │   ├── memory/                 # mem0 + Qdrant integration

│   │   └── main.py

│   └── requirements.txt

│

├── codebase-analyst/               # AI code intelligence

│   ├── frontend/                   # Next.js · File Explorer · Chat UI

│   ├── backend/                    # FastAPI · ChromaDB · Redis · SSE

│   │   ├── pipeline/               # Clone → Parse → Chunk → Embed

│   │   ├── retrieval/              # RAG query engine

│   │   └── analysis/               # Claude analysis layer

│   └── requirements.txt

│

├── alignment-lab/                  # AI safety & evaluation research

│   ├── frontend/                   # Next.js · Dashboard · Heatmaps

│   ├── backend/                    # FastAPI · Celery · PostgreSQL

│   │   ├── harness/                # Multi-model eval runner

│   │   ├── probes/                 # Bias · Toxicity · Alignment tests

│   │   └── frameworks/             # TruLens · DeepEval · LangSmith

│   └── requirements.txt

│

├── voice-assistant/                # Local offline voice AI

│   ├── frontend/                   # Next.js · Voice recorder

│   ├── backend/                    # FastAPI on :8004 · Ollama · mem0

│   │   ├── speech/                 # Whisper STT · Coqui TTS

│   │   └── memory/                 # mem0 persistent context

│   └── requirements.txt

│

├── video-ai/                       # Multimodal video intelligence

│   ├── frontend/                   # React dashboard · Timeline UI

│   ├── backend/                    # FFmpeg · Whisper · vLLM · LanceDB

│   │   ├── processor/              # Frame + audio extraction

│   │   ├── embeddings/             # Transcript + frame vectors

│   │   └── qa_engine/              # Retrieval + multimodal reasoning

│   └── requirements.txt

│

├── screenshots/                    # UI screenshots (for README)

├── *.mp4                           # Demo recordings (in-repo)

├── *_flow_chart.png                # Architecture diagrams (in-repo)

└── README.md


🔌 API Reference
Browser Agent
Endpoint
Method
Description
/api/agent/run
POST
Submit a natural language browser task
/api/agent/status/{id}
GET
Poll task progress
/api/agent/result/{id}
GET
Retrieve extracted output


curl -X POST https://browser-agent-khaki.vercel.app/api/agent/run \

  -H "Content-Type: application/json" \

  -d '{"task": "Search GitHub for trending Python AI repos this week and return top 5"}'
Codebase Analyst
Endpoint
Method
Description
/api/analyze
POST
Index a GitHub repo or uploaded zip
/api/query
POST
Ask a question about indexed code
/api/docs/generate
POST
Auto-generate documentation

Alignment Lab
Endpoint
Method
Description
/api/eval/run
POST
Start an evaluation experiment
/api/eval/results/{id}
GET
Fetch scored results
/api/models/compare
POST
Side-by-side model comparison

Video AI
Endpoint
Method
Description
/api/video/upload
POST
Upload video for multimodal processing
/api/video/ask
POST
Q&A grounded to video timestamps
/api/video/summary
GET
Get AI-generated video summary
/api/video/highlights
GET
Extract key moments



📊 Performance Overview
Project
Metric
Value
Browser Agent
Avg. task completion
~15–30s
Browser Agent
Action loop accuracy
Vision-guided (no brittle selectors)
Codebase Analyst
Query response (streaming)
First token < 1s
Codebase Analyst
Indexing 1K files
~45–90s
Alignment Lab
Parallel eval throughput
N models × M prompts, batched
Voice Assistant
Voice round-trip latency
~1.5–3s (fully local)
Video AI
5-min video processing
~40–90s (FFmpeg + Whisper)



🔒 Security & Privacy
Voice Assistant: 100% local — zero network requests for LLM inference
No persistent cloud storage — inputs processed in memory, not retained
API keys server-side only — never exposed to frontend clients
Rate limiting on all FastAPI endpoints
Input validation on all upload and URL endpoints (path traversal, file type checks)
CORS policy — strict origin allowlist on deployed APIs


🗺 Roadmap
Near Term (Q3 2026) Browser Agent: parallel multi-tab execution
Codebase Analyst: GitHub PR webhook auto-review
Voice Assistant: wake word detection (Porcupine)
Video AI: YouTube URL input (stream processing)
Unified API gateway across all 5 projects
Medium Term (Q4 2026) Multi-model toggle UI (switch Claude ↔ GPT-4o ↔ local Ollama at runtime)
Alignment Lab: public benchmark dataset release
Browser Agent: long-horizon task memory (multi-session goals)
Unified observability dashboard (logs, latency, token usage)
Long Term (2027) Agent orchestration framework — all 5 projects as composable tools
Plugin marketplace for community extensions
Enterprise API with auth + usage billing
Open-source the Alignment Lab evaluation framework


🤝 Contributing
# 1. Fork and branch

git checkout -b feat/your-feature

# 2. Commit with conventional format

git commit -m "feat(browser-agent): add multi-tab parallel execution"

# Types: feat · fix · docs · refactor · test · perf

# 3. Push and open PR

git push origin feat/your-feature

Open an issue before starting large features. Check existing issues for good first contributions.


📜 License
MIT License — Copyright (c) 2026 Kalyan

Free to use, modify, and distribute with attribution.


👤 Author
 Kalyan
AI Developer · Full-Stack Engineer B.Tech CS · Vignan's Institute of Engineering for Women, Andhra Pradesh

Building production AI systems at the intersection of agents, multimodal reasoning, and local-first architecture.

  



 Engineered with precision. Deployed for impact.

If this helped you — drop a ⭐ Star. It helps others find this work.

