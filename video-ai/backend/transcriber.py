import whisper
from typing import Dict, Any, List

class Transcriber:
    def __init__(self, model_name: str = "base"):
        self.model = whisper.load_model(model_name)

    def transcribe(self, audio_path: str) -> Dict[str, Any]:
        result = self.model.transcribe(audio_path, word_timestamps=True)
        return result

    def get_timestamped_segments(self, audio_path: str) -> List[Dict[str, Any]]:
        result = self.transcribe(audio_path)
        segments = []
        for seg in result["segments"]:
            segments.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
                "words": [
                    {"word": w["word"], "start": w["start"], "end": w["end"]}
                    for w in seg.get("words", [])
                ]
            })
        return segments

    def get_full_text(self, audio_path: str) -> str:
        result = self.transcribe(audio_path)
        return result["text"].strip()

    def search_in_transcript(self, audio_path: str, query: str) -> List[Dict[str, Any]]:
        segments = self.get_timestamped_segments(audio_path)
        results = []
        for seg in segments:
            if query.lower() in seg["text"].lower():
                results.append(seg)
        return results
