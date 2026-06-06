from typing import List

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.utils.pdf_utils import merge_pdfs, split_pdf

router = APIRouter()


@router.post("/merge")
async def merge(files: List[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(400, "At least two PDF files are required.")
    file_data = [(f.filename or "file.pdf", await f.read()) for f in files]
    try:
        path = merge_pdfs(file_data)
    except Exception as e:
        raise HTTPException(400, str(e))
    return FileResponse(path, media_type="application/pdf", filename="merged.pdf")


@router.post("/split")
async def split(
    file: UploadFile = File(...),
    pages: str = Form(...),
):
    data = await file.read()
    try:
        path = split_pdf(data, pages)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return FileResponse(path, media_type="application/pdf", filename="split.pdf")
