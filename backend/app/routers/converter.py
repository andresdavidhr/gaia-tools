import logging
import os

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from starlette.concurrency import run_in_threadpool

from app.utils.converter_utils import (
    ConversionError,
    convert_image,
    convert_video,
    convert_audio,
    convert_document,
)

router = APIRouter()
log = logging.getLogger(__name__)

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


async def _convert(kind: str, fn, *args):
    """Ejecuta la conversión fuera del event loop y sirve el resultado.

    La conversión es CPU/IO-bound y síncrona: dentro del event loop bloquearía
    toda la API mientras dura. El temporal se borra al terminar la respuesta.
    """
    try:
        out = await run_in_threadpool(fn, *args)
    except ConversionError as e:
        log.warning("Conversión de %s fallida: %s", kind, e)
        raise HTTPException(500, f"No se pudo convertir el {kind}.")
    except Exception:
        log.exception("Error inesperado convirtiendo %s", kind)
        raise HTTPException(500, f"No se pudo convertir el {kind}.")
    return out


def _respond(path: str, target_format: str) -> FileResponse:
    return FileResponse(
        path,
        media_type=MEDIA_TYPES[target_format],
        filename=f"resultado.{target_format}",
        background=BackgroundTask(_cleanup, path),
    )


def _cleanup(path: str) -> None:
    try:
        os.unlink(path)
    except OSError:
        pass


@router.post("/image")
async def image(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower()
    _check_format("image", target_format)
    out = await _convert("imagen", convert_image, await file.read(), target_format)
    return _respond(out, target_format)


@router.post("/video")
async def video(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower()
    _check_format("video", target_format)
    out = await _convert("vídeo", convert_video, await file.read(), file.filename or "input", target_format)
    return _respond(out, target_format)


@router.post("/audio")
async def audio(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower()
    _check_format("audio", target_format)
    out = await _convert("audio", convert_audio, await file.read(), file.filename or "input", target_format)
    return _respond(out, target_format)


@router.post("/document")
async def document(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower()
    _check_format("document", target_format)
    out = await _convert("documento", convert_document, await file.read(), file.filename or "input", target_format)
    return _respond(out, target_format)
