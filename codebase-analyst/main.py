import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from repo_loader.loader import RepoLoader
from parser.code_parser import CodeParser
from embeddings.embedder import CodeEmbedder
from vector_db.lance_db import LanceVectorDB
from llm.qa_engine import QAEngine
from summaries.repo_summary import RepoSummarizer

load_dotenv()

app = FastAPI(title="Codebase Analyst API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

loader = RepoLoader()
parser = CodeParser()
embedder = CodeEmbedder()
vector_db = LanceVectorDB()
qa = QAEngine()
summarizer = RepoSummarizer()

class LoadRepoRequest(BaseModel):
    url: str = ""
    local_path: str = ""

class QuestionRequest(BaseModel):
    question: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "codebase-analyst"}

@app.post("/load")
def load_repo(req: LoadRepoRequest):
    try:
        path = req.url if req.url else req.local_path
        is_url = bool(req.url)
        if is_url:
            path = loader.clone_repo(req.url)
        else:
            loader.load_local(req.local_path)

        files = loader.get_all_files()
        tree = loader.get_directory_tree()
        chunks = parser.parse_all(files)
        chunks = embedder.embed_chunks(chunks)

        vector_db.create_table("codebase", embedder.dimension, overwrite=True)
        vector_db.insert("codebase", chunks)

        overview = summarizer.generate_overview(files, tree)
        return {"status": "ok", "files": len(files), "chunks": len(chunks), "overview": overview}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
def ask_question(req: QuestionRequest):
    try:
        query_embedding = embedder.embed(req.question)
        results = vector_db.search("codebase", query_embedding, limit=8)
        if not results:
            return {"answer": "No relevant code found. Load a repository first."}
        answer = qa.answer(req.question, results)
        sources = [
            eval(r.get("metadata", "{}")).get("file", "unknown")
            for r in results
        ]
        return {"answer": answer, "sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
def get_stats():
    return {"tables": vector_db.list_tables(), "count": vector_db.get_stats("codebase")}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
