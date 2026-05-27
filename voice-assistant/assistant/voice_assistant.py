import os
import json
import time
import threading
from typing import Optional, Dict, Any

class VoiceAssistant:
    def __init__(self):
        self.listening = False
        self.speaking = False
        self.conversation_history = []
        self.user_name = None
        self.model = "llama3.2"

    def process_query(self, text: str) -> str:
        prompt = self._build_prompt(text)

        try:
            import ollama
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            reply = response["message"]["content"]
        except:
            reply = f"I heard: {text}. (Ollama not running - install with 'ollama pull llama3.2')"

        self.conversation_history.append({"user": text, "assistant": reply})
        self._save_conversation()
        return reply

    def _build_prompt(self, text: str) -> str:
        context = ""
        if self.user_name:
            context = f"The user's name is {self.user_name}. "
        if self.conversation_history:
            recent = self.conversation_history[-3:]
            context += "Recent conversation:\n" + "\n".join(
                f"User: {c['user']}\nAssistant: {c['assistant']}" for c in recent
            )
        return f"{context}\n\nUser: {text}\nAssistant:"

    def set_user_name(self, name: str):
        self.user_name = name

    def _save_conversation(self):
        os.makedirs("conversations", exist_ok=True)
        with open(f"conversations/session_{int(time.time())}.json", "w") as f:
            json.dump(self.conversation_history, f, indent=2)

    def get_history(self) -> list:
        return self.conversation_history

    def clear_history(self):
        self.conversation_history = []
