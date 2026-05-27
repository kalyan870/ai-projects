import sqlite3
import json
import os
from typing import List, Dict, Any
from datetime import datetime

class LocalMemory:
    def __init__(self, db_path: str = "memory/assistant_memory.db"):
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self._init_db()

    def _init_db(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT DEFAULT 'default',
                content TEXT,
                metadata TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE,
                data TEXT DEFAULT '{}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.commit()

    def add(self, user_id: str, content: str, metadata: Dict = None):
        self.conn.execute(
            "INSERT INTO memories (user_id, content, metadata) VALUES (?, ?, ?)",
            (user_id, content, json.dumps(metadata or {}))
        )
        self.conn.commit()

    def search(self, user_id: str, query: str) -> List[Dict[str, Any]]:
        cursor = self.conn.execute(
            "SELECT content, metadata, created_at FROM memories WHERE user_id = ? AND content LIKE ? ORDER BY created_at DESC LIMIT 10",
            (user_id, f"%{query}%")
        )
        return [
            {"content": row[0], "metadata": json.loads(row[1]), "created_at": row[2]}
            for row in cursor.fetchall()
        ]

    def get_recent(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        cursor = self.conn.execute(
            "SELECT content, metadata, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit)
        )
        return [
            {"content": row[0], "metadata": json.loads(row[1]), "created_at": row[2]}
            for row in cursor.fetchall()
        ]

    def set_preference(self, user_id: str, key: str, value: Any):
        cursor = self.conn.execute("SELECT data FROM preferences WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            data = json.loads(row[0])
            data[key] = value
            self.conn.execute(
                "UPDATE preferences SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                (json.dumps(data), user_id)
            )
        else:
            self.conn.execute(
                "INSERT INTO preferences (user_id, data) VALUES (?, ?)",
                (user_id, json.dumps({key: value}))
            )
        self.conn.commit()

    def get_preferences(self, user_id: str) -> Dict[str, Any]:
        cursor = self.conn.execute("SELECT data FROM preferences WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        return json.loads(row[0]) if row else {}

    def close(self):
        self.conn.close()
