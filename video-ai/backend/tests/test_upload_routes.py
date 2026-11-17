from __future__ import annotations

import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))


def _stub_module(name: str, cls_name: str, cls: type) -> None:
    module = types.ModuleType(name)
    setattr(module, cls_name, cls)
    sys.modules[name] = module


class _VideoProcessor:
    def __init__(self):
        self.upload_dir = tempfile.mkdtemp(prefix="video-ai-test-")


class _Noop:
    def __init__(self, *args, **kwargs):
        pass


_stub_module("backend.video_processor", "VideoProcessor", _VideoProcessor)
_stub_module("backend.transcriber", "Transcriber", _Noop)
_stub_module("backend.summarizer", "VideoSummarizer", _Noop)
_stub_module("backend.qa_engine", "VideoQA", _Noop)

from fastapi.testclient import TestClient
import backend.main as api


class _FakeStorage:
    def presign_upload(self, key: str, content_type: str) -> str:
        return f"https://r2.invalid/{key}?signed=1"


class UploadRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(api.app)

    def test_upload_url_is_short_lived_and_server_signed(self):
        with patch.object(api.R2Storage, "from_env", return_value=_FakeStorage()):
            response = self.client.post("/api/upload-url", json={
                "filename": "walkthrough.mp4", "contentType": "video/mp4", "size": 2048,
            })
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["method"], "PUT")
        self.assertEqual(body["expires_in"], 300)
        self.assertEqual(body["headers"], {"Content-Type": "video/mp4"})
        self.assertEqual(body["upload_url"], f"https://r2.invalid/{body['object_key']}?signed=1")
        self.assertRegex(body["object_key"], rf"^uploads/{body['video_id']}\.mp4$")

    def test_upload_url_rejects_unsupported_and_oversized_files(self):
        unsupported = self.client.post("/api/upload-url", json={
            "filename": "payload.exe", "contentType": "application/octet-stream", "size": 12,
        })
        oversized = self.client.post("/api/upload-url", json={
            "filename": "video.mp4", "contentType": "video/mp4", "size": 300 * 1024 * 1024,
        })
        self.assertEqual(unsupported.status_code, 400)
        self.assertEqual(oversized.status_code, 400)

    def test_upload_url_rejects_mismatched_content_type(self):
        response = self.client.post("/api/upload-url", json={
            "filename": "walkthrough.mp4", "contentType": "text/plain", "size": 2048,
        })
        self.assertEqual(response.status_code, 400)

    def test_upload_url_fails_closed_without_private_r2_config(self):
        from backend.storage import StorageNotConfigured

        with patch.object(api.R2Storage, "from_env", side_effect=StorageNotConfigured()):
            response = self.client.post("/api/upload-url", json={
                "filename": "walkthrough.mp4", "contentType": "video/mp4", "size": 2048,
            })
        self.assertEqual(response.status_code, 503)

    def test_process_rejects_a_key_for_another_video_id(self):
        response = self.client.post(
            "/api/process/00000000-0000-0000-0000-000000000001",
            params={"object_key": "uploads/00000000-0000-0000-0000-000000000002.mp4"},
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
