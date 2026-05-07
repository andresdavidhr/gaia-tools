from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from app.utils.converter_utils import (
    convert_image,
    convert_video,
    convert_audio,
    convert_document,
)
import os

router = APIRouter()

SUPPORTED = {
    "image": ("jpg", "jpeg", "png", "webp", "gif"),
    "video": ("mp4", "avi", "mkv"),
    "audio": ("mp3", "wav", "ogg"),
    "document": ("pdf", "docx", "txt"),
}

MEDIA_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif",
    "mp4": "video/mp4", "avi": "video/x-msvideo", "mkv": "video/x-matroska",
    "mp3": "audio/mpeg", "wav": "audio/wav", "ogg": "audio/ogg",
    "pdf": "application/pdf", "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}


def _check_format(kind: str, fmt: str):
    if fmt not in SUPPORTED[kind]:
        raise HTTPException(400, f"Formato '{fmt}' no soportado para {kind}.")


@router.post("/image")
async def image(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower()
    _check_format("image", target_format)
    try:
        out = convert_image(await file.read(), target_format)
    except Exception as e:
        raise HTTPException(500, str(e))
    return FileResponse(out, media_type=MEDIA_TYPES[target_format], filename=f"resultado.{target_format}")


@router.post("/video")
async def video(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower()
    _check_format("video", target_format)
    try:
        out = convert_video(await file.read(), file.filename or "input", target_format)
    except Exception as e:
        raise HTTPException(500, str(e))
    return FileResponse(out, media_type=MEDIA_TYPES[target_format], filename=f"resultado.{target_format}")


@router.post("/audio")
async def audio(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower()
    _check_format("audio", target_format)
    try:
        out = convert_audio(await file.read(), file.filename or "input", target_format)
    except Exception as e:
        raise HTTPException(500, str(e))
    return FileResponse(out, media_type=MEDIA_TYPES[target_format], filename=f"resultado.{target_format}")


@router.post("/document")
async def document(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower()
    _check_format("document", target_format)
    try:
        out = convert_document(await file.read(), file.filename or "input", target_format)
    except Exception as e:
        raise HTTPException(500, str(e))
    return FileResponse(out, media_type=MEDIA_TYPES[target_format], filename=f"resultado.{target_format}")
