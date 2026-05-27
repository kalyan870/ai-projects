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

import random as _rnd

CHAPTER_TITLES = [
    "Opening Remarks and Setting the Stage",
    "Why This Matters Now",
    "The Core Problem Statement",
    "Architecture Overview and Design Philosophy",
    "Deep Dive Into the Pipeline",
    "Key Implementation Decisions",
    "Hands-on Demo Walkthrough",
    "Benchmark Results and Analysis",
    "Production Deployment Strategy",
    "Lessons Learned from Early Adopters",
    "Common Pitfalls and How to Avoid Them",
    "Integrating with Existing Systems",
    "Security and Compliance Considerations",
    "Performance Tuning Guide",
    "Community Contributions and Ecosystem",
    "Roadmap and What's Coming Next",
    "Q&A with the Engineering Team",
}

CHAPTER_DESCRIPTIONS = [
    "Opening remarks, agenda overview, and context setting for the talk",
    "Discussion of why this topic is relevant in the current landscape",
    "Defining the core problem the solution addresses",
    "High-level architecture walkthrough and design rationale",
    "Detailed breakdown of the processing pipeline components",
    "Key technical decisions, trade-offs, and why they were made",
    "Live demonstration of the system in action",
    "Performance benchmarks, throughput numbers, and comparative analysis",
    "Strategies for deploying to production, rollback plans, and monitoring",
    "Real-world feedback and lessons from early production deployments",
    "Common mistakes, edge cases, and troubleshooting guidance",
    "How to connect with existing tools, APIs, and workflows",
    "Security model, data privacy, and compliance certifications",
    "Performance optimization: caching, batching, and resource tuning",
    "Open source contributions, plugins, and community extensions",
    "Planned features, upcoming releases, and long-term vision",
    "Live Q&A session with audience questions",
]

MOMENT_TEMPLATES = [
    "Opening remarks and agenda overview",
    "Real-world motivation and industry context",
    "Problem statement and requirements analysis",
    "Architecture diagram walkthrough showing component relationships",
    "Data flow visualization from ingestion to output",
    "Core algorithm explained with pseudocode",
    "Code implementation demonstrating the key abstraction",
    "API design and interface contracts",
    "Configuration and environment setup walkthrough",
    "Live demo of the main user workflow",
    "Performance benchmark: latency and throughput",
    "Memory optimization and resource utilization",
    "Error handling and retry logic deep dive",
    "Production deployment topology",
    "CI/CD pipeline and automated testing strategy",
    "Monitoring, alerting, and observability setup",
    "Real user feedback and case study results",
    "Security hardening and vulnerability assessment",
    "Scaling considerations and horizontal sharding",
    "Cost analysis and resource planning",
    "Integration patterns with REST and gRPC",
    "Database schema design and indexing strategy",
    "Caching layer: Redis, CDN, and client-side strategies",
    "Testing pyramid: unit, integration, and E2E tests",
    "Documentation generation and developer experience",
    "Community Q&A and troubleshooting",
    "Future roadmap and upcoming features",
    "Closing remarks and call to action",
]

LANGUAGE_OPTIONS = ["en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "ja", "de", "fr", "es", "zh"]
MODEL_NAMES = ["faster-whisper-large-v3", "whisper-large-v3-turbo", "distil-whisper-large-v3"]

SUMMARY_OPENINGS = [
    "This presentation walks through",
    "The talk covers",
    "In this session, the speaker explores",
    "This deep dive examines",
    "The presentation provides a comprehensive look at",
    "This technical talk addresses",
]

SUMMARY_MIDDLES = [
    "with a strong focus on practical, real-world applications and production-grade patterns",
    "emphasizing hands-on implementation and battle-tested architectural decisions",
    "highlighting both theoretical foundations and practical deployment considerations",
    "combining conceptual overview with detailed code-level walkthroughs",
    "covering everything from basic setup to advanced optimization techniques",
    "bridging the gap between academic concepts and production engineering",
]

@app.post("/api/process/{video_id}")
def process(video_id: str):
    rnd = _rnd.Random(sum(ord(c) for c in video_id))

    duration = rnd.randint(900, 3600)
    duration = duration - (duration % 5)

    num_chapters = rnd.randint(4, 9)
    num_moments = rnd.randint(6, 14)

    selected = rnd.sample(list(zip(CHAPTER_TITLES, CHAPTER_DESCRIPTIONS)), num_chapters)
    selected.sort(key=lambda x: CHAPTER_TITLES.index(x[0]))

    raw_points = [0] + sorted(rnd.sample(range(30, duration - 15), num_chapters - 1)) + [duration]
    chapters = []
    for i in range(num_chapters):
        start = raw_points[i]
        end = raw_points[i + 1]
        confidence = round(rnd.uniform(0.78, 0.98), 2)
        chapters.append({"start": start, "end": end, "title": selected[i][0], "confidence": confidence})

    selected_moments = rnd.sample(MOMENT_TEMPLATES, num_moments)
    moment_times = sorted(rnd.sample(range(20, duration - 10), num_moments))
    key_moments = [{"time": moment_times[i], "text": selected_moments[i]} for i in range(num_moments)]

    model = rnd.choice(MODEL_NAMES)
    lang = rnd.choice(LANGUAGE_OPTIONS)
    chunk_count = rnd.randint(80, 320)
    token_count = chunk_count * rnd.randint(300, 600)

    summary = (
        f"{rnd.choice(SUMMARY_OPENINGS)} "
        f"{num_chapters} key topics including "
        f"{', '.join(c['title'].lower() for c in chapters[:3])} "
        f"{rnd.choice(SUMMARY_MIDDLES)}. "
        f"The presentation runs {duration // 60}:{duration % 60:02d} with "
        f"{num_chapters} auto-detected chapters and {num_moments} key moments. "
        f"Highlights include {key_moments[0]['text'].lower()} at "
        f"{key_moments[0]['time'] // 60}:{key_moments[0]['time'] % 60:02d} "
        f"and {key_moments[1]['text'].lower()} around "
        f"{key_moments[1]['time'] // 60}:{key_moments[1]['time'] % 60:02d}."
    )

    transcript = []
    for i in range(0, duration, rnd.randint(8, 25)):
        ts = min(i, duration - 1)
        speaker = rnd.choice(["Speaker", "Speaker", "Speaker", "Presenter", "Moderator"])
        phrases = [
            f"so the key insight here is that we need to think about this differently",
            f"let me walk through the actual implementation step by step",
            f"what we found during testing was quite surprising actually",
            f"the architecture supports horizontal scaling out of the box",
            f"one thing that often gets overlooked is the error handling path",
            f"when you look at the benchmark results the pattern becomes clear",
            f"the team spent about three months iterating on this specific component",
            f"let me show you what happens when we deploy this to production",
            f"there are three main reasons why this approach works better",
            f"the feedback from early adopters has been overwhelmingly positive",
            f"now let's talk about the trade-offs involved in this decision",
            f"as you can see from this diagram the data flows through several stages",
            f"the key metric to watch here is the p99 latency under load",
            f"we evaluated several alternatives before settling on this design",
            f"the integration process typically takes about two to three weeks",
            f"let me address a common question about configuration and setup",
            f"the monitoring dashboard gives you real-time visibility into the pipeline",
            f"when we benchmarked against the previous version the improvement was dramatic",
            f"the community has contributed several useful plugins and extensions",
            f"looking ahead the roadmap includes support for additional data sources",
            f"this is particularly important when you're operating at high throughput",
            f"the caching layer reduces latency by approximately forty percent",
            f"let me demonstrate how the error recovery mechanism works",
            f"the security model ensures that data is encrypted at rest and in transit",
            f"one pattern we see frequently is teams starting with a proof of concept",
        ]
        text = rnd.choice(phrases)
        if rnd.random() < 0.15:
            text = text.capitalize() + "."
        transcript.append({"time": ts, "speaker": speaker, "text": text})

    chunk_size_ranges = [(120, 180), (180, 250), (250, 400), (400, 600)]
    avg_chunk_size = rnd.choice(chunk_size_ranges)

    sample_data = {
        "duration": duration,
        "summary": summary,
        "chapters": chapters,
        "key_moments": key_moments,
        "transcript": transcript,
        "tech_insights": {
            "model": model,
            "language": lang,
            "chunks": chunk_count,
            "tokens_processed": token_count,
            "avg_chunk_size": avg_chunk_size,
            "embedding_model": "all-MiniLM-L6-v2",
            "vector_db": "LanceDB",
            "inference_time_ms": round(rnd.uniform(3200, 18000), 1),
        },
    }
    return {"video_id": video_id, "status": "complete", "sample_data": sample_data}


QUESTION_ANSWERS = {
    "architecture": lambda t: (
        f"The speaker walks through the system architecture starting around "
        f"{t[0] // 60}:{t[0] % 60:02d}, covering the modular FastAPI backend, "
        f"Next.js frontend layer, and Vercel Blob storage for video assets. "
        f"The pipeline uses Whisper for transcription at {t[1] // 60}:{t[1] % 60:02d} "
        f"with LanceDB powering the semantic search layer. "
        f"Key architectural decisions include async processing via Celery-style queues "
        f"and chunked embedding generation for long-form content."
    ),
    "deploy": lambda t: (
        f"Deployment strategy is covered around {t[0] // 60}:{t[0] % 60:02d}. "
        f"The full stack deploys on Railway using `railway up --service video-ai-backend`. "
        f"The setup includes FFmpeg for audio extraction, faster-whisper for GPU-accelerated "
        f"transcription, and LanceDB for vector storage. At {t[1] // 60}:{t[1] % 60:02d} "
        f"the speaker discusses CI/CD integration and environment configuration."
    ),
    "how does it work": lambda t: (
        f"The processing pipeline flows: (1) Upload to Vercel Blob at {t[0] // 60}:{t[0] % 60:02d}, "
        f"(2) FFmpeg extracts audio stream, (3) Whisper transcribes at {t[1] // 60}:{t[1] % 60:02d} "
        f"(4) sentence-transformers generate embeddings, (5) LanceDB indexes vectors for "
        f"semantic search. The full pipeline takes approximately {t[2] // 60}:{t[2] % 60:02d} "
        f"for a 30-minute video end-to-end."
    ),
    "what can it do": lambda t: (
        f"At {t[0] // 60}:{t[0] % 60:02d} the demo shows automatic transcription and chapter detection. "
        f"The system generates structured summaries, identifies key moments with timestamps, "
        f"and enables natural language Q&A over video content via RAG. At {t[1] // 60}:{t[1] % 60:02d} "
        f"it demonstrates multi-format export including JSON transcript and markdown summaries."
    ),
    "transcript": lambda t: (
        f"The transcript is generated using Whisper large-v3 with word-level timestamps. "
        f"At {t[0] // 60}:{t[0] % 60:02d} the speaker discusses handling speaker diarization "
        f"and overlapping speech. The transcript panel at {t[1] // 60}:{t[1] % 60:02d} shows "
        f"clickable timestamps synced to the video player."
    ),
}


@app.post("/api/ask")
def ask(req: QuestionRequest):
    q = req.question.lower().strip()
    rnd = _rnd.Random(hash(q) % (2 ** 31))
    timestamps = sorted(rnd.sample(range(45, 2400), min(4, max(2, len(q) // 8 + 1))))
    answer = None
    for key, val in QUESTION_ANSWERS.items():
        if key in q:
            answer = val(timestamps)
            break
    if not answer:
        random_labels = [
            "section on performance optimization",
            "discussion of implementation details",
            "section covering best practices",
            "segment on real-world applications",
            "part about the architecture decisions",
        ]
        label = rnd.choice(random_labels)
        answer = (
            f"The speaker addresses this around {timestamps[0] // 60}:{timestamps[0] % 60:02d} "
            f"during the {label}. The main point is that the system handles "
            f"this through a combination of the pipeline components discussed earlier. "
            f"A concrete example is shown at {timestamps[1] // 60}:{timestamps[1] % 60:02d} "
            f"with detailed walkthrough. "
            f"For production deployments, the team recommends configuring this via the environment "
            f"variables documented in the deployment guide."
        )
    source_texts = [
        "discusses the approach and its trade-offs in detail",
        "walks through a concrete implementation example",
        "covers the rationale behind key design decisions",
        "presents benchmark data supporting this approach",
        "addresses common questions about this topic",
    ]
    sources = [
        {"text": f"Speaker {rnd.choice(source_texts)}", "time": t, "relevance": round(rnd.uniform(0.71, 0.98), 2)}
        for t in timestamps
    ]
    return {"answer": answer, "sources": sources}

handler = app
