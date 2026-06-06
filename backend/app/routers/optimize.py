import tempfile
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image

router = APIRouter()

SUPPORTED = {"jpeg", "jpg", "png", "webp"}
MEDIA_TYPES = {"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
SAVE_FORMAT = {"jpeg": "JPEG", "jpg": "JPEG", "png": "PNG", "webp": "WEBP"}


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

    img = Image.open(BytesIO(data))
    if img.mode in ("RGBA", "P") and ext in ("jpeg", "jpg"):
        img = img.convert("RGB")

    fmt = SAVE_FORMAT[ext]
    suffix = f".{ext if ext != 'jpg' else 'jpeg'}"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        path = tmp.name

    save_kwargs: dict = {"format": fmt, "optimize": True}
    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
    elif fmt == "PNG":
        save_kwargs["compress_level"] = max(0, min(9, (100 - quality) // 10))

    img.save(path, **save_kwargs)

    import os
    compressed_size = os.path.getsize(path)

    response = FileResponse(
        path,
        media_type=MEDIA_TYPES[ext],
        filename=f"optimized.{ext if ext != 'jpg' else 'jpeg'}",
    )
    response.headers["X-Original-Size"] = str(original_size)
    response.headers["X-Compressed-Size"] = str(compressed_size)
    response.headers["Access-Control-Expose-Headers"] = "X-Original-Size, X-Compressed-Size"
    return response
