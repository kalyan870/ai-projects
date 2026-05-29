import os
import numpy as np
import tempfile
import scipy.io.wavfile as wav
from typing import Optional

class AudioProcessor:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self._stt_model = None

    def _get_stt(self):
        if self._stt_model is None:
            import whisper
            self._stt_model = whisper.load_model("base")
        return self._stt_model

    def record(self, duration: float = 5.0) -> np.ndarray:
        import sounddevice as sd
        print(f"Recording for {duration}s...")
        audio = sd.rec(int(duration * self.sample_rate), samplerate=self.sample_rate, channels=1, dtype=np.float32)
        sd.wait()
        print("Done.")
        return audio.flatten()

    def save_wav(self, audio: np.ndarray, path: Optional[str] = None) -> str:
        if path is None:
            tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            path = tmp.name
        wav.write(path, self.sample_rate, audio)
        return path

    def transcribe(self, audio_path: str) -> str:
        model = self._get_stt()
        result = model.transcribe(audio_path, language="en")
        return result["text"].strip()

    def record_and_transcribe(self, duration: float = 5.0) -> str:
        audio = self.record(duration)
        path = self.save_wav(audio)
        return self.transcribe(path)

    def speak(self, text: str):
        try:
            import pyttsx3
            engine = pyttsx3.init()
            engine.say(text)
            engine.runAndWait()
        except Exception as e:
            print(f"TTS error: {e}")
