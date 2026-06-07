from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.utils.compress_utils import create_tar, create_zip

router = APIRouter()

VALID_FORMATS = {"zip", "tar", "tar.gz", "tar.bz2"}
TAR_COMPRESSION = {"tar": "", "tar.gz": "gz", "tar.bz2": "bz2"}


@router.post("/")
async def compress(
    files: List[UploadFile] = File(...),
    fmt: str = Form(...),
    password: Optional[str] = Form(default=None),
):
    if fmt not in VALID_FORMATS:
        raise HTTPException(400, f"Format must be one of: {', '.join(VALID_FORMATS)}.")
    if not files:
        raise HTTPException(400, "At least one file is required.")
    if password and fmt != "zip":
        raise HTTPException(400, "Password protection is only available for ZIP.")

    file_data: list[tuple[str, bytes]] = []
    for f in files:
        data = await f.read()
        file_data.append((f.filename or "file", data))

    try:
        if fmt == "zip":
            path = create_zip(file_data, password or None)
            filename = "archive.zip"
            media_type = "application/zip"
        else:
            compression = TAR_COMPRESSION[fmt]
            path = create_tar(file_data, compression)
            filename = f"archive.{fmt}"
            media_type = "application/x-tar"
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Compression failed: {type(e).__name__}: {e}")

    return FileResponse(path, media_type=media_type, filename=filename)
