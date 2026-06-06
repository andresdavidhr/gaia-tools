import tempfile
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image

router = APIRouter()

SAVE_FORMAT = {"jpeg": "JPEG", "jpg": "JPEG", "png": "PNG", "webp": "WEBP",
               "gif": "GIF", "bmp": "BMP", "tiff": "TIFF"}
MEDIA_TYPES = {"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png",
               "webp": "image/webp", "gif": "image/gif", "bmp": "image/bmp", "tiff": "image/tiff"}


def _open_and_ext(data: bytes, filename: str):
    ext = (filename or "").rsplit(".", 1)[-1].lower() or "png"
    img = Image.open(BytesIO(data))
    return img, ext


def _save(img: Image.Image, ext: str, name: str):
    fmt = SAVE_FORMAT.get(ext, "PNG")
    if fmt == "JPEG" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        img.save(tmp.name, format=fmt, optimize=True)
        return tmp.name, MEDIA_TYPES.get(ext, "image/png"), name


@router.post("/resize")
async def resize_image(
    file: UploadFile = File(...),
    width: int = Form(...),
    height: int = Form(...),
    keep_ratio: bool = Form(default=True),
):
    if width < 1 or height < 1:
        raise HTTPException(400, "Width and height must be positive.")
    data = await file.read()
    img, ext = _open_and_ext(data, file.filename or "")
    if keep_ratio:
        img = img.copy()
        img.thumbnail((width, height), Image.LANCZOS)
    else:
        img = img.resize((width, height), Image.LANCZOS)
    path, media_type, fname = _save(img, ext, f"resized.{ext}")
    return FileResponse(path, media_type=media_type, filename=fname)


@router.post("/crop")
async def crop_image(
    file: UploadFile = File(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
):
    data = await file.read()
    img, ext = _open_and_ext(data, file.filename or "")
    if x < 0 or y < 0 or width < 1 or height < 1:
        raise HTTPException(400, "Invalid crop coordinates.")
    if x + width > img.width or y + height > img.height:
        raise HTTPException(400, f"Crop area exceeds image bounds ({img.width}×{img.height}).")
    img = img.crop((x, y, x + width, y + height))
    path, media_type, fname = _save(img, ext, f"cropped.{ext}")
    return FileResponse(path, media_type=media_type, filename=fname)
