import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

from app.utils.qr_utils import generate_qr

router = APIRouter()


class QRRequest(BaseModel):
    text: str
    size: str = "M"


@router.post("/generate")
async def generate(req: QRRequest):
    if not req.text.strip():
        raise HTTPException(400, "El texto no puede estar vacío.")
    if req.size.upper() not in ("S", "M", "L"):
        raise HTTPException(400, "Tamaño inválido. Usa S, M o L.")
    try:
        path = generate_qr(req.text, req.size)
    except Exception as e:
        raise HTTPException(500, str(e))
    return FileResponse(path, media_type="image/png", filename="qrcode.png",
                        background=BackgroundTask(_cleanup, path))


def _cleanup(path: str) -> None:
    try:
        os.unlink(path)
    except OSError:
        pass
