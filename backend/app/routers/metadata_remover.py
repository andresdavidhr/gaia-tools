from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image
from starlette.concurrency import run_in_threadpool

router = APIRouter()

SAVE_FORMAT = {"jpeg": "JPEG", "jpg": "JPEG", "png": "PNG", "webp": "WEBP",
               "tiff": "TIFF", "bmp": "BMP"}
MEDIA_TYPES = {"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png",
               "webp": "image/webp", "tiff": "image/tiff", "bmp": "image/bmp"}


def _strip(data: bytes, ext: str) -> tuple[bytes, int]:
    """Reconstruye la imagen píxel a píxel, dejando fuera todo metadato."""
    try:
        img = Image.open(BytesIO(data))
    except Exception:
        raise ValueError("Cannot open image.")

    try:
        raw_exif = img._getexif() or {} if hasattr(img, "_getexif") else {}
        fields_removed = len(raw_exif)
    except Exception:
        fields_removed = 0

    clean = Image.new(img.mode, img.size)
    clean.putdata(list(img.getdata()))

    fmt = SAVE_FORMAT.get(ext, "PNG")
    if fmt == "JPEG" and clean.mode in ("RGBA", "P"):
        clean = clean.convert("RGB")

    buf = BytesIO()
    clean.save(buf, format=fmt, optimize=True)
    return buf.getvalue(), fields_removed


@router.post("/")
async def remove_metadata(file: UploadFile = File(...)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() or "png"
    data = await file.read()

    # putdata() sobre una imagen grande es lento: fuera del event loop.
    try:
        clean_bytes, fields_removed = await run_in_threadpool(_strip, data, ext)
    except ValueError as e:
        raise HTTPException(422, str(e))

    return Response(
        content=clean_bytes,
        media_type=MEDIA_TYPES.get(ext, "image/png"),
        headers={
            "Content-Disposition": f'attachment; filename="clean.{ext}"',
            "X-Original-Size": str(len(data)),
            "X-Cleaned-Size": str(len(clean_bytes)),
            "X-Fields-Removed": str(fields_removed),
            "Access-Control-Expose-Headers": "X-Original-Size, X-Cleaned-Size, X-Fields-Removed",
        },
    )
