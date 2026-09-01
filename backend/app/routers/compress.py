from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool

from app.utils.compress_utils import create_tar, create_zip

router = APIRouter()

VALID_FORMATS = {"zip", "tar", "tar.gz", "tar.bz2"}
TAR_COMPRESSION = {"tar": "", "tar.gz": "gz", "tar.bz2": "bz2"}

MEDIA_TYPES = {
    "zip":    "application/zip",
    "tar":    "application/x-tar",
    "tar.gz": "application/x-tar",
    "tar.bz2":"application/x-tar",
}


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

    # Comprimir es CPU-bound: fuera del event loop para no congelar la API.
    try:
        if fmt == "zip":
            content = await run_in_threadpool(create_zip, file_data, password or None)
        else:
            content = await run_in_threadpool(create_tar, file_data, TAR_COMPRESSION[fmt])
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Compression failed: {type(e).__name__}: {e}")

    filename = f"archive.{fmt}"
    return Response(
        content=content,
        media_type=MEDIA_TYPES[fmt],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
