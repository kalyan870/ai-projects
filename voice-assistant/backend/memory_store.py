import os
import json
from typing import List

class MemoryStore:
    def __init__(self, user_id: str = "default"):
        self.user_id = user_id
        self.memories: List[str] = []
        self._load()

    def _path(self) -> str:
        d = os.path.join(os.path.dirname(__file__), "..", "memory")
        os.makedirs(d, exist_ok=True)
        return os.path.join(d, f"{self.user_id}.json")

    def _load(self):
        p = self._path()
        if os.path.exists(p):
            with open(p) as f:
                self.memories = json.load(f)

    def _save(self):
        with open(self._path(), "w") as f:
            json.dump(self.memories, f, indent=2)

    def add(self, message: str, metadata: dict = None):
        self.memories.append(message)
        self._save()

    def search(self, query: str, limit: int = 5) -> List[str]:
        q = query.lower()
        matched = [m for m in self.memories if q in m.lower()]
        return matched[:limit]

    def get_all(self) -> List[str]:
        return self.memories

    def get_relevant_context(self, query: str, max_results: int = 3) -> str:
        results = self.search(query, limit=max_results)
        if not results:
            return ""
        return "Relevant memories:\n" + "\n".join(f"- {m}" for m in results)
