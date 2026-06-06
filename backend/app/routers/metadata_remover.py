import tempfile
from io import BytesIO

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse
from PIL import ExifTags, Image

router = APIRouter()

SAVE_FORMAT = {"jpeg": "JPEG", "jpg": "JPEG", "png": "PNG", "webp": "WEBP",
               "tiff": "TIFF", "bmp": "BMP"}
MEDIA_TYPES = {"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png",
               "webp": "image/webp", "tiff": "image/tiff", "bmp": "image/bmp"}


@router.post("/")
async def remove_metadata(file: UploadFile = File(...)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() or "png"
    data = await file.read()

    img = Image.open(BytesIO(data))

    # Count EXIF fields before removal
    raw_exif = img._getexif() or {}
    fields_removed = len(raw_exif)

    # Strip by re-creating the image data without any metadata
    clean = Image.new(img.mode, img.size)
    clean.putdata(list(img.getdata()))

    fmt = SAVE_FORMAT.get(ext, "PNG")
    if fmt == "JPEG" and clean.mode in ("RGBA", "P"):
        clean = clean.convert("RGB")

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        clean.save(tmp.name, format=fmt, optimize=True)
        path = tmp.name

    import os
    original_size   = len(data)
    compressed_size = os.path.getsize(path)

    response = FileResponse(
        path,
        media_type=MEDIA_TYPES.get(ext, "image/png"),
        filename=f"clean.{ext}",
    )
    response.headers["X-Original-Size"]   = str(original_size)
    response.headers["X-Cleaned-Size"]    = str(compressed_size)
    response.headers["X-Fields-Removed"]  = str(fields_removed)
    response.headers["Access-Control-Expose-Headers"] = (
        "X-Original-Size, X-Cleaned-Size, X-Fields-Removed"
    )
    return response
