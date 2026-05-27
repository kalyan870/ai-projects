import json
import os
from typing import List, Dict, Any
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

PLANNER_SYSTEM = """You are a browser automation planner. Convert user goals into executable browser action sequences.
Output ONLY a JSON array of actions. No other text."""

class AgentPlanner:
    def __init__(self, model: str = "deepseek-chat"):
        self.model = model

    def plan(self, goal: str, context: str = "") -> List[Dict[str, Any]]:
        prompt = f"""User goal: {goal}
Previous context: {context}

Available actions: navigate, search_google, click, fill, extract_text, extract_table, scroll, screenshot, done

Output a JSON array of action objects with "action" and "params" keys.
Example: [{"action": "navigate", "params": {"url": "https://example.com"}}]"""

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": PLANNER_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )

        content = response.choices[0].message.content.strip()
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)

    def refine_plan(self, goal: str, previous_actions: List[Dict], result: str) -> List[Dict[str, Any]]:
        return self.plan(
            goal=goal,
            context=f"Previous actions: {json.dumps(previous_actions)}\nResult: {result}"
        )
