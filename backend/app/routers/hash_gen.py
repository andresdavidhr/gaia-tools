from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from typing import Optional
from app.utils.hash_utils import compute

router = APIRouter()


@router.post("/generate")
async def generate(
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    if file:
        data = await file.read()
    elif text is not None:
        data = text.encode()
    else:
        raise HTTPException(400, "Proporciona texto o un archivo.")
    return compute(data)
