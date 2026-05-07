from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.utils.downloader_utils import download_video, get_video_info

router = APIRouter()


class DownloadRequest(BaseModel):
    url: str
    format: str = "mp3"
    quality: str = "best"
    custom_filename: str = ""


@router.get("/info")
async def info(url: str):
    try:
        return get_video_info(url)
    except Exception as e:
        raise HTTPException(400, f"No se pudo obtener información: {e}")


@router.post("/download")
async def download(req: DownloadRequest):
    if req.format not in ("mp3", "mp4"):
        raise HTTPException(400, "Formato no soportado. Usa 'mp3' o 'mp4'.")

    try:
        file_path, filename = download_video(req.url, req.format, req.quality, req.custom_filename)
    except Exception as e:
        raise HTTPException(500, f"Error al descargar: {e}")

    media_type = "audio/mpeg" if req.format == "mp3" else "video/mp4"
    return FileResponse(file_path, media_type=media_type, filename=filename, background=None)
