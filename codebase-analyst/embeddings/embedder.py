from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import numpy as np

class CodeEmbedder:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()

    def embed(self, text: str) -> List[float]:
        return self.model.encode(text, normalize_embeddings=True).tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return [emb.tolist() for emb in embeddings]

    def embed_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        texts = []
        for c in chunks:
            name = c.get('name', '')
            content = c.get('content', '')[:1000]
            texts.append(f"{c['type']}: {name}\n{content}")

        embeddings = self.embed_batch(texts)
        for i, c in enumerate(chunks):
            c['embedding'] = embeddings[i]
            c['text_for_search'] = texts[i]
        return chunks
