import os
from typing import Dict, Any, List
from mem0 import Memory

class MemoryManager:
    def __init__(self):
        self.memory = Memory(
            config={
                "vector_store": {
                    "provider": "supabase",
                    "url": os.getenv("SUPABASE_URL", ""),
                    "api_key": os.getenv("SUPABASE_KEY", ""),
                },
                "llm": {
                    "provider": "openai",
                    "api_key": os.getenv("OPENAI_API_KEY", ""),
                }
            }
        )

    def add(self, user_id: str, data: str, metadata: Dict[str, Any] = None):
        self.memory.add(data, user_id=user_id, metadata=metadata or {})

    def search(self, user_id: str, query: str) -> List[Dict[str, Any]]:
        return self.memory.search(query, user_id=user_id)

    def get_all(self, user_id: str) -> List[Dict[str, Any]]:
        return self.memory.get_all(user_id=user_id)

    def update_preferences(self, user_id: str, preferences: Dict[str, Any]):
        self.memory.add(
            f"User preferences: {preferences}",
            user_id=user_id,
            metadata={"type": "preferences"}
        )

    def get_recent(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        memories = self.get_all(user_id)
        return memories[:limit]

    def delete_user(self, user_id: str):
        self.memory.delete_all(user_id=user_id)
