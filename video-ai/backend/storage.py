"""Private, short-lived Cloudflare R2 uploads for Video AI."""

from __future__ import annotations

import os
import re
import uuid
from pathlib import Path
from typing import Any

MAX_UPLOAD_BYTES = 250 * 1024 * 1024
UPLOAD_TTL_SECONDS = 300
ALLOWED_TYPES = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".webm": "video/webm",
}
VIDEO_KEY_RE = re.compile(r"^uploads/([0-9a-f-]{36})(\.(?:mp4|mov|mkv|avi|webm))$")


class StorageNotConfigured(RuntimeError):
    pass


class InvalidUpload(ValueError):
    pass


def validate_upload(filename: str, content_type: str, size: int) -> tuple[str, str, str]:
    """Return (uuid, object key, canonical MIME) or reject unsafe upload metadata."""
    name = Path(filename or "").name
    if not name or name in {".", ".."} or Path(filename or "").name != filename:
        raise InvalidUpload("Filename must be a simple file name.")
    ext = Path(name).suffix.lower()
    expected_type = ALLOWED_TYPES.get(ext)
    if expected_type is None or content_type.lower().split(";", 1)[0].strip() != expected_type:
        raise InvalidUpload("Unsupported video format or content type.")
    if not isinstance(size, int) or size <= 0 or size > MAX_UPLOAD_BYTES:
        raise InvalidUpload("Video must be between 1 byte and 250 MB.")
    video_id = str(uuid.uuid4())
    return video_id, f"uploads/{video_id}{ext}", expected_type


def validate_object_key(video_id: str, object_key: str) -> None:
    try:
        canonical_id = str(uuid.UUID(video_id))
    except (ValueError, TypeError, AttributeError) as exc:
        raise InvalidUpload("Invalid video id.") from exc
    match = VIDEO_KEY_RE.fullmatch(object_key or "")
    if match is None or match.group(1) != canonical_id:
        raise InvalidUpload("Upload key does not match this video id.")


class R2Storage:
    def __init__(self, client: Any, bucket: str):
        self.client = client
        self.bucket = bucket

    @classmethod
    def from_env(cls) -> "R2Storage":
        account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
        access_key = os.getenv("R2_ACCESS_KEY_ID", "").strip()
        secret_key = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
        bucket = os.getenv("R2_BUCKET_NAME", "").strip()
        if not all((account_id, access_key, secret_key, bucket)):
            raise StorageNotConfigured("Private R2 upload storage is not configured.")
        import boto3
        from botocore.config import Config

        client = boto3.client(
            "s3",
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            region_name="auto",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        )
        return cls(client, bucket)

    def presign_upload(self, key: str, content_type: str) -> str:
        return self.client.generate_presigned_url(
            "put_object",
            Params={"Bucket": self.bucket, "Key": key, "ContentType": content_type},
            ExpiresIn=UPLOAD_TTL_SECONDS,
        )

    def download(self, key: str, destination: str | Path) -> int:
        head = self.client.head_object(Bucket=self.bucket, Key=key)
        size = int(head.get("ContentLength", 0))
        content_type = str(head.get("ContentType", "")).lower().split(";", 1)[0].strip()
        allowed_type = ALLOWED_TYPES.get(Path(key).suffix.lower())
        if size <= 0 or size > MAX_UPLOAD_BYTES or content_type != allowed_type:
            raise InvalidUpload("Uploaded object failed size or content-type validation.")
        self.client.download_file(self.bucket, key, str(destination))
        return size

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)
