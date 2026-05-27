import lancedb
import pyarrow as pa
from typing import List, Dict, Any, Optional
import uuid

class LanceVectorDB:
    def __init__(self, db_path: str = "./lancedb_data"):
        self.db = lancedb.connect(db_path)

    def create_table(self, table_name: str, dimension: int, overwrite: bool = False):
        schema = pa.schema([
            pa.field("id", pa.string()),
            pa.field("embedding", pa.list_(pa.float32(), dimension)),
            pa.field("text", pa.string()),
            pa.field("metadata", pa.string()),
        ])
        if overwrite and table_name in self.db.table_names():
            self.db.drop_table(table_name)
        if table_name not in self.db.table_names():
            self.db.create_table(table_name, schema=schema)

    def insert(self, table_name: str, chunks: List[Dict[str, Any]]):
        if table_name not in self.db.table_names():
            raise ValueError(f"Table {table_name} does not exist")

        table = self.db.open_table(table_name)
        data = []
        for c in chunks:
            data.append({
                "id": str(uuid.uuid4()),
                "embedding": c["embedding"],
                "text": c.get("text_for_search", c.get("content", "")),
                "metadata": str({
                    "type": c.get("type", ""),
                    "name": c.get("name", ""),
                    "file": c.get("file", ""),
                })
            })
        table.add(data)

    def search(self, table_name: str, query_embedding: List[float], limit: int = 10) -> List[Dict[str, Any]]:
        table = self.db.open_table(table_name)
        results = table.search(query_embedding).limit(limit).to_list()
        return results

    def list_tables(self) -> List[str]:
        return self.db.table_names()

    def delete_table(self, table_name: str):
        if table_name in self.db.table_names():
            self.db.drop_table(table_name)

    def get_stats(self, table_name: str) -> Dict[str, Any]:
        if table_name not in self.db.table_names():
            return {"count": 0}
        table = self.db.open_table(table_name)
        return {"count": len(table)}
