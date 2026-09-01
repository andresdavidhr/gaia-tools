import logging
import os
import shutil

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

from app.utils.downloader_utils import download_video, get_video_info

router = APIRouter()
log = logging.getLogger(__name__)


class DownloadRequest(BaseModel):
    url: str
    format: str = "mp3"
    quality: str = "best"
    custom_filename: str = ""


# Endpoints síncronos a propósito: yt-dlp bloquea, y FastAPI ejecuta los
# handlers `def` en un threadpool en lugar de dentro del event loop.
@router.get("/info")
def info(url: str):
    try:
        return get_video_info(url)
    except Exception as e:
        raise HTTPException(400, f"No se pudo obtener información: {e}")


@router.post("/download")
def download(req: DownloadRequest):
    if req.format not in ("mp3", "mp4"):
        raise HTTPException(400, "Formato no soportado. Usa 'mp3' o 'mp4'.")

    try:
        file_path, filename = download_video(req.url, req.format, req.quality, req.custom_filename)
    except Exception as e:
        raise HTTPException(500, f"Error al descargar: {e}")

    media_type = "audio/mpeg" if req.format == "mp3" else "video/mp4"
    # El fichero vive en un mkdtemp propio: se borra entero al cerrar la respuesta.
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename,
        background=BackgroundTask(shutil.rmtree, os.path.dirname(file_path), ignore_errors=True),
    )
