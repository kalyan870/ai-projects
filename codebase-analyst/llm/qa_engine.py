import os
from typing import List, Dict, Any
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

SYSTEM_PROMPT = """You are a codebase analyst expert. Given code context and a user question:
1. Analyze the relevant code snippets
2. Explain architecture, flow, and dependencies
3. Provide specific file paths and line references
4. Be concise but thorough

Context from codebase:
{context}

Answer the user's question based only on the provided context."""

class QAEngine:
    def __init__(self, model: str = "deepseek-chat"):
        self.model = model

    def answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> str:
        context = self._format_context(context_chunks)

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
                {"role": "user", "content": question}
            ],
            temperature=0.3,
            max_tokens=2048
        )

        return response.choices[0].message.content

    def _format_context(self, chunks: List[Dict[str, Any]]) -> str:
        parts = []
        for c in chunks:
            meta = eval(c.get("metadata", "{}")) if isinstance(c.get("metadata"), str) else c.get("metadata", {})
            file = meta.get("file", "unknown")
            name = meta.get("name", "unknown")
            text = c.get("text", "")[:500]
            parts.append(f"--- {file} / {name} ---\n{text}")
        return "\n\n".join(parts[:10])

    def summarize_repo(self, files: List[Dict[str, Any]]) -> str:
        summary_prompt = "Summarize the following codebase structure and purpose:\n\n"
        for f in files[:20]:
            summary_prompt += f"- {f['path']} ({f['size']} chars)\n"

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a codebase summarizer. Give a high-level overview of what this codebase does."},
                {"role": "user", "content": summary_prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content
