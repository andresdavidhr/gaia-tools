from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image
from starlette.concurrency import run_in_threadpool

router = APIRouter()

SUPPORTED = {"jpeg", "jpg", "png", "webp"}
MEDIA_TYPES = {"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
SAVE_FORMAT = {"jpeg": "JPEG", "jpg": "JPEG", "png": "PNG", "webp": "WEBP"}


def _encode(data: bytes, ext: str, quality: int) -> bytes:
    img = Image.open(BytesIO(data))
    if img.mode in ("RGBA", "P") and ext in ("jpeg", "jpg"):
        img = img.convert("RGB")

    fmt = SAVE_FORMAT[ext]
    save_kwargs: dict = {"format": fmt, "optimize": True}
    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
    elif fmt == "PNG":
        save_kwargs["compress_level"] = max(0, min(9, (100 - quality) // 10))

    buf = BytesIO()
    img.save(buf, **save_kwargs)
    return buf.getvalue()


@router.post("/")
async def optimize(
    file: UploadFile = File(...),
    quality: int = Form(default=80),
):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in SUPPORTED:
        raise HTTPException(400, f"Unsupported format. Use: {', '.join(sorted(SUPPORTED))}.")
    if not (1 <= quality <= 100):
        raise HTTPException(400, "Quality must be between 1 and 100.")

    data = await file.read()
    original_size = len(data)

    # Pillow bloquea: una imagen grande dentro del event loop congela la API.
    compressed_bytes = await run_in_threadpool(_encode, data, ext, quality)

    out_ext = ext if ext != "jpg" else "jpeg"
    return Response(
        content=compressed_bytes,
        media_type=MEDIA_TYPES[ext],
        headers={
            "Content-Disposition": f'attachment; filename="optimized.{out_ext}"',
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(len(compressed_bytes)),
            "Access-Control-Expose-Headers": "X-Original-Size, X-Compressed-Size",
        },
    )
