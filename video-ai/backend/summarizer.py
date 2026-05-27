import os
from typing import List, Dict, Any
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

class VideoSummarizer:
    def __init__(self, model: str = "deepseek-chat"):
        self.model = model

    def generate_chapters(self, transcript: str, duration: float) -> List[Dict[str, Any]]:
        prompt = f"""Given this video transcript ({duration:.0f}s), divide it into logical chapters with timestamps.
Output as JSON array: [{{"start": seconds, "end": seconds, "title": "Chapter Title"}}]

Transcript:
{transcript[:12000]}"""

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a video chapter generator. Output only JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        import json
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(content)
        except:
            return [{"start": 0, "end": duration, "title": "Full Video"}]

    def generate_summary(self, transcript: str, duration: float) -> str:
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Summarize this video transcript. Include key moments and main points."},
                {"role": "user", "content": f"Video duration: {duration:.0f}s\n\nTranscript:\n{transcript[:15000]}"}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content

    def generate_key_moments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        text_for_analysis = "\n".join([f"[{s['start']:.1f}s]: {s['text']}" for s in segments])
        prompt = f"From these transcript segments, identify the top 10 most important/key moments. Return as JSON array: [{{\"time\": seconds, \"text\": \"what happens\"}}]\n\n{text_for_analysis[:12000]}"

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Extract key moments. Output only JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        import json
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(content)
        except:
            return []
