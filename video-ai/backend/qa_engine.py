import os
import json
from typing import List, Dict, Any
from openai import OpenAI
from sentence_transformers import SentenceTransformer
import lancedb

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

SYSTEM_PROMPT = """You are a video QA assistant. Given transcript segments and timestamps:
1. Answer questions about the video content
2. Reference specific timestamps
3. Describe what happens at requested times

Context:
{context}"""

class VideoQA:
    def __init__(self, model: str = "deepseek-chat"):
        self.model = model
        self.embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
        self.db = None

    def init_db(self, db_path: str = "./lancedb_data"):
        self.db = lancedb.connect(db_path)

    def index_segments(self, segments: List[Dict[str, Any]], video_id: str):
        if not self.db:
            return

        import pyarrow as pa
        table_name = f"video_{video_id}"

        if table_name in self.db.table_names():
            self.db.drop_table(table_name)

        schema = pa.schema([
            pa.field("id", pa.string()),
            pa.field("vector", pa.list_(pa.float32(), 384)),
            pa.field("text", pa.string()),
            pa.field("start", pa.float32()),
            pa.field("end", pa.float32()),
        ])
        self.db.create_table(table_name, schema=schema)
        table = self.db.open_table(table_name)

        data = []
        for seg in segments:
            emb = self.embedder.encode(seg["text"], normalize_embeddings=True).tolist()
            data.append({
                "id": f"{video_id}_{seg['start']}",
                "vector": emb,
                "text": seg["text"],
                "start": seg["start"],
                "end": seg["end"],
            })
        table.add(data)

    def answer(self, question: str, video_id: str, segments: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        if self.db and self.db.table_names():
            table_name = f"video_{video_id}"
            if table_name in self.db.table_names():
                table = self.db.open_table(table_name)
                q_emb = self.embedder.encode(question, normalize_embeddings=True).tolist()
                results = table.search(q_emb).limit(5).to_list()
            else:
                results = segments[:10] if segments else []
        else:
            results = segments[:10] if segments else []

        context = "\n".join([
            f"[{r.get('start', r.get('time', 0)):.1f}s - {r.get('end', r.get('start', 0) + 5):.1f}s]: {r.get('text', r.get('description', ''))}"
            for r in results
        ])

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
                {"role": "user", "content": question}
            ],
            temperature=0.3
        )

        return {
            "answer": response.choices[0].message.content,
            "sources": results
        }

    def describe_scene(self, time: float, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        nearby = [
            s for s in segments
            if abs(s.get("start", 0) - time) < 30
        ]
        context = json.dumps(nearby[:5])

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Describe what happens at the requested timestamp in this video."},
                {"role": "user", "content": f"What happens at {time:.1f} seconds?\n\nContext:\n{context}"}
            ],
            temperature=0.3
        )
        return {
            "time": time,
            "description": response.choices[0].message.content,
            "segments": nearby
        }
