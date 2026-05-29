import os, json, re, random
from http import HTTPStatus
from flask import Flask, request, jsonify

app = Flask(__name__)

HISTORY: dict[str, list[dict]] = {}
MEMORY: dict[str, list[str]] = {}

GREETINGS = ["hello", "hi", "hey", "greetings", "sup", "yo", "howdy"]
FAREWELLS = ["bye", "goodbye", "see you", "later", "cya"]
THANKS = ["thanks", "thank you", "appreciate", "grateful"]
HOW_ARE_YOU = ["how are you", "how's it going", "how do you do", "what's up"]
NAME_QUESTIONS = ["what is your name", "what's your name", "who are you", "your name"]
CAPABILITIES = ["what can you do", "help", "capabilities", "features", "what do you do"]

RESPONSES = {
    "greeting": ["Hello!", "Hi there!", "Hey! How can I help?", "Greetings!", "Hi, nice to see you!"],
    "farewell": ["Goodbye!", "See you later!", "Take care!", "Bye! Come back anytime."],
    "thanks": ["You're welcome!", "Happy to help!", "Anytime!", "My pleasure!"],
    "how_are_you": ["I'm doing great, thanks for asking!", "All systems operational!", "I'm running smoothly, how about you?", "Doing well!"],
    "name": ["I'm Voice Assistant, your local AI companion.", "I'm called Voice Assistant — built with Flask and hosted on Vercel.", "Voice Assistant at your service!"],
    "capabilities": ["I can chat with you, remember things, and help with questions. Try: 'Remember that I like...' or ask me anything!"],
    "default": ["I'm not sure how to answer that, but I'm learning!", "Interesting question! Could you tell me more?", "I hear you. Can you rephrase that?", "I'm a simple assistant right now, but I can remember things you tell me!"],
}

def detect_intent(text: str) -> str:
    t = text.lower().strip()
    if any(g in t for g in GREETINGS): return "greeting"
    if any(f in t for f in FAREWELLS): return "farewell"
    if any(tk in t for tk in THANKS): return "thanks"
    if any(q in t for q in HOW_ARE_YOU): return "how_are_you"
    if any(q in t for q in NAME_QUESTIONS): return "name"
    if any(q in t for q in CAPABILITIES): return "capabilities"
    if "remember" in t:
        parts = re.split(r'(?:remember\s+(?:that\s+)?)', t)
        if len(parts) > 1:
            return "remember"
    return "default"

def generate_response(intent: str, text: str, user_id: str) -> str:
    if intent == "remember":
        parts = re.split(r'(?:remember\s+(?:that\s+)?)', text.lower())
        if len(parts) > 1 and parts[1].strip():
            fact = parts[1].strip().rstrip(".,!")
            if user_id not in MEMORY:
                MEMORY[user_id] = []
            MEMORY[user_id].append(fact)
            return f"Got it! I'll remember that {fact}."
        return "What should I remember?"
    if intent in RESPONSES and RESPONSES[intent]:
        return random.choice(RESPONSES[intent])
    return random.choice(RESPONSES["default"])

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "voice-assistant", "model": "fallback"})

@app.route("/api/ask", methods=["POST"])
def ask():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    user_id = data.get("user_id", "default")
    if not text.strip():
        return jsonify({"text": "", "response": "Please say something!", "memory_context": False})
    if user_id not in HISTORY:
        HISTORY[user_id] = []
    HISTORY[user_id].append({"role": "user", "text": text})
    intent = detect_intent(text)
    response = generate_response(intent, text, user_id)
    HISTORY[user_id].append({"role": "assistant", "text": response})
    ctx = bool(MEMORY.get(user_id, []))
    return jsonify({"text": text, "response": response, "memory_context": ctx})

@app.route("/api/clear", methods=["POST"])
def clear():
    user_id = request.args.get("user_id", "default")
    if user_id in HISTORY:
        HISTORY[user_id] = []
    return jsonify({"status": "ok"})

@app.route("/api/history", methods=["GET"])
def history():
    user_id = request.args.get("user_id", "default")
    return jsonify({"conversations": (HISTORY.get(user_id) or [])[-30:]})

@app.route("/api/memory", methods=["GET"])
@app.route("/api/memory/<user_id>", methods=["GET"])
def get_memory(user_id="default"):
    return jsonify({"memories": MEMORY.get(user_id, [])})

handler = app.wsgi_app
