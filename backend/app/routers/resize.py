from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
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


def _encode(img: Image.Image, ext: str) -> tuple[bytes, str]:
    fmt = SAVE_FORMAT.get(ext, "PNG")
    if fmt == "JPEG" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format=fmt, optimize=True)
    return buf.getvalue(), MEDIA_TYPES.get(ext, "image/png")


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
    content, media_type = _encode(img, ext)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="resized.{ext}"'},
    )


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
    content, media_type = _encode(img, ext)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="cropped.{ext}"'},
    )
