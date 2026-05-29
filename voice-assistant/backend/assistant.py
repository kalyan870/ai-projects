import os
import ollama
from typing import List, Dict

class Assistant:
    def __init__(self, model: str = None):
        self.model = model or os.environ.get("OLLAMA_MODEL", "tinyllama")
        self.history: List[Dict[str, str]] = []
        self.system_prompt = (
            "You are a helpful, private voice assistant that runs locally. "
            "You have access to the user's memories. Be concise, natural, and conversational. "
            "If the user mentions something they like, a preference, or a fact about themselves, say you'll remember it. "
            "Keep responses under 3 sentences when possible."
        )

    def process(self, text: str, memory_context: str = "") -> str:
        messages = [{"role": "system", "content": self.system_prompt}]

        if memory_context:
            messages.append({"role": "system", "content": f"Here are relevant memories for context:\n{memory_context}"})

        for turn in self.history[-6:]:
            messages.append({"role": "user", "content": turn["user"]})
            messages.append({"role": "assistant", "content": turn["assistant"]})

        messages.append({"role": "user", "content": text})

        response = ollama.chat(model=self.model, messages=messages, options={"temperature": 0.7, "num_predict": 512})
        reply = response["message"]["content"].strip()

        self.history.append({"user": text, "assistant": reply})
        if len(self.history) > 50:
            self.history = self.history[-50:]

        return reply

    def get_history(self) -> List[Dict[str, str]]:
        return self.history

    def clear(self):
        self.history = []
