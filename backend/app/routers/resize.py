from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image
from starlette.concurrency import run_in_threadpool

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


def _do_resize(data: bytes, filename: str, width: int, height: int, keep_ratio: bool):
    img, ext = _open_and_ext(data, filename)
    if keep_ratio:
        img = img.copy()
        img.thumbnail((width, height), Image.LANCZOS)
    else:
        img = img.resize((width, height), Image.LANCZOS)
    content, media_type = _encode(img, ext)
    return content, media_type, ext


def _do_crop(data: bytes, filename: str, x: int, y: int, width: int, height: int):
    img, ext = _open_and_ext(data, filename)
    if x + width > img.width or y + height > img.height:
        raise ValueError(f"Crop area exceeds image bounds ({img.width}\u00d7{img.height}).")
    img = img.crop((x, y, x + width, y + height))
    content, media_type = _encode(img, ext)
    return content, media_type, ext


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
    # Decodificar/reescalar con Pillow es CPU-bound: fuera del event loop.
    content, media_type, ext = await run_in_threadpool(
        _do_resize, data, file.filename or "", width, height, keep_ratio
    )
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
    if x < 0 or y < 0 or width < 1 or height < 1:
        raise HTTPException(400, "Invalid crop coordinates.")
    data = await file.read()
    try:
        content, media_type, ext = await run_in_threadpool(
            _do_crop, data, file.filename or "", x, y, width, height
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="cropped.{ext}"'},
    )
