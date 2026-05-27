import numpy as np
from typing import Optional, Callable

class WakeWordDetector:
    def __init__(self, wake_word: str = "hey assistant"):
        self.wake_word = wake_word.lower()
        self.callback: Optional[Callable] = None
        self.is_listening = False

    def set_callback(self, callback: Callable):
        self.callback = callback

    def start_listening(self):
        self.is_listening = True
        print(f"Listening for wake word: '{self.wake_word}'")

    def stop_listening(self):
        self.is_listening = False

    def process_audio(self, audio_chunk: np.ndarray) -> bool:
        if not self.is_listening:
            return False
        return self._detect_wake_word(audio_chunk)

    def _detect_wake_word(self, audio: np.ndarray) -> bool:
        energy = np.sqrt(np.mean(audio ** 2))
        if energy > 0.1 and self.callback:
            return True
        return False

    def simple_detect(self, text: str) -> bool:
        return self.wake_word in text.lower()
