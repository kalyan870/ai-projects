import os
import subprocess
from typing import List, Dict, Any
import ffmpeg

class VideoProcessor:
    def __init__(self, upload_dir: str = "uploads", frames_dir: str = "frames", audio_dir: str = "audio"):
        self.upload_dir = upload_dir
        self.frames_dir = frames_dir
        self.audio_dir = audio_dir
        os.makedirs(upload_dir, exist_ok=True)
        os.makedirs(frames_dir, exist_ok=True)
        os.makedirs(audio_dir, exist_ok=True)

    def extract_audio(self, video_path: str) -> str:
        audio_path = os.path.join(self.audio_dir, f"{os.path.splitext(os.path.basename(video_path))[0]}.wav")
        subprocess.run([
            "ffmpeg", "-i", video_path,
            "-vn", "-acodec", "pcm_s16le",
            "-ar", "16000", "-ac", "1",
            audio_path, "-y"
        ], capture_output=True)
        return audio_path

    def extract_frames(self, video_path: str, interval: int = 5) -> List[str]:
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        frames = []
        probe = ffmpeg.probe(video_path)
        duration = float(probe['format']['duration'])

        for t in range(0, int(duration), interval):
            frame_path = os.path.join(self.frames_dir, f"{video_name}_frame_{t:04d}.jpg")
            subprocess.run([
                "ffmpeg", "-ss", str(t), "-i", video_path,
                "-vframes", "1", "-q:v", "2",
                frame_path, "-y"
            ], capture_output=True)
            frames.append(frame_path)

        return frames

    def get_video_info(self, video_path: str) -> Dict[str, Any]:
        probe = ffmpeg.probe(video_path)
        stream = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        return {
            "duration": float(probe['format']['duration']),
            "width": int(stream['width']),
            "height": int(stream['height']),
            "codec": stream['codec_name'],
            "fps": eval(stream.get('r_frame_rate', '0/1')),
            "size": os.path.getsize(video_path)
        }

    def get_video_duration(self, video_path: str) -> float:
        probe = ffmpeg.probe(video_path)
        return float(probe['format']['duration'])
