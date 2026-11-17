# Private video uploads with Cloudflare R2

The backend issues five-minute, object-specific `PUT` URLs. It accepts only a supported video extension and matching MIME type, limits uploads to 250 MB, and checks the stored object again before downloading it for processing.

Set these values only in the backend runtime (never in `NEXT_PUBLIC_*` variables):

```text
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
CORS_ORIGINS=https://your-frontend-domain.example
```

Set `NEXT_PUBLIC_VIDEO_API_BASE` in the frontend deployment to the backend origin, without a trailing slash. When set, local video-file uploads use the R2 flow below; the URL-import demo path remains unchanged.

Create a bucket-scoped R2 token with object read/write access to this bucket only. Add the deployed frontend origin to that bucket's CORS policy with `PUT` allowed and `Content-Type` allowed. Keep the bucket private; the API returns no public object URL.

Upload flow:

1. `POST /api/upload-url` with `{ "filename": "demo.mp4", "contentType": "video/mp4", "size": 1234 }`.
2. `PUT` the bytes to `upload_url` with the returned `Content-Type` header.
3. `POST /api/process/{video_id}?object_key={object_key}`.

The existing local multipart `/api/upload` route remains available for local processing. This repository has no user-account flow, so Clerk is not added. Its current transcript/embedding artifacts are file-backed rather than relational records, so Neon is not added.
