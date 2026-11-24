import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from storage import (
    InvalidUpload,
    R2Storage,
    StorageNotConfigured,
    validate_object_key,
    validate_upload,
)


class FakeR2Client:
    def __init__(self, head=None):
        self.head = head or {"ContentLength": 42, "ContentType": "video/mp4"}
        self.calls = []

    def generate_presigned_url(self, operation, Params, ExpiresIn):
        self.calls.append((operation, Params, ExpiresIn))
        return "https://r2.invalid/signed"

    def head_object(self, **kwargs):
        self.calls.append(("head_object", kwargs))
        return self.head

    def download_file(self, bucket, key, destination):
        self.calls.append(("download_file", bucket, key, destination))

    def delete_object(self, **kwargs):
        self.calls.append(("delete_object", kwargs))


class StorageTests(unittest.TestCase):
    def test_valid_upload_gets_random_private_key(self):
        video_id, key, mime = validate_upload("demo.mp4", "video/mp4", 42)
        validate_object_key(video_id, key)
        self.assertRegex(key, r"^uploads/[0-9a-f-]{36}\.mp4$")
        self.assertEqual(mime, "video/mp4")

    def test_rejects_unsafe_filename_and_mime(self):
        with self.assertRaises(InvalidUpload):
            validate_upload("../demo.mp4", "video/mp4", 42)
        with self.assertRaises(InvalidUpload):
            validate_upload("demo.mp4", "text/plain", 42)

    def test_rejects_empty_or_oversized_upload(self):
        with self.assertRaises(InvalidUpload):
            validate_upload("demo.mp4", "video/mp4", 0)
        with self.assertRaises(InvalidUpload):
            validate_upload("demo.mp4", "video/mp4", 250 * 1024 * 1024 + 1)

    def test_rejects_mismatched_object_key(self):
        with self.assertRaises(InvalidUpload):
            validate_object_key("00000000-0000-0000-0000-000000000000", "uploads/00000000-0000-0000-0000-000000000001.mp4")

    def test_presigned_upload_is_short_lived_and_type_bound(self):
        client = FakeR2Client()
        storage = R2Storage(client, "private-bucket")
        url = storage.presign_upload("uploads/id.mp4", "video/mp4")
        self.assertEqual(url, "https://r2.invalid/signed")
        self.assertEqual(client.calls[0][0], "put_object")
        self.assertEqual(client.calls[0][1]["ContentType"], "video/mp4")
        self.assertEqual(client.calls[0][2], 300)

    def test_download_validates_metadata_before_fetching(self):
        client = FakeR2Client()
        storage = R2Storage(client, "private-bucket")
        with tempfile.TemporaryDirectory() as temp_dir:
            storage.download("uploads/id.mp4", Path(temp_dir) / "video.mp4")
        self.assertEqual(client.calls[-1][0], "download_file")

    def test_download_rejects_mismatched_content_type(self):
        client = FakeR2Client({"ContentLength": 42, "ContentType": "text/plain"})
        storage = R2Storage(client, "private-bucket")
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(InvalidUpload):
                storage.download("uploads/id.mp4", Path(temp_dir) / "video.mp4")
        self.assertEqual(len(client.calls), 1)

    def test_missing_credentials_fail_closed(self):
        names = ("CLOUDFLARE_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME")
        with patch.dict(os.environ, {name: "" for name in names}):
            with self.assertRaises(StorageNotConfigured):
                R2Storage.from_env()


if __name__ == "__main__":
    unittest.main()
