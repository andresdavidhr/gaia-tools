from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image

router = APIRouter()

SAVE_FORMAT = {"jpeg": "JPEG", "jpg": "JPEG", "png": "PNG", "webp": "WEBP",
               "tiff": "TIFF", "bmp": "BMP"}
MEDIA_TYPES = {"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png",
               "webp": "image/webp", "tiff": "image/tiff", "bmp": "image/bmp"}


@router.post("/")
async def remove_metadata(file: UploadFile = File(...)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() or "png"
    data = await file.read()

    try:
        img = Image.open(BytesIO(data))
    except Exception:
        raise HTTPException(422, "Cannot open image.")

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
    clean_bytes = buf.getvalue()

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
