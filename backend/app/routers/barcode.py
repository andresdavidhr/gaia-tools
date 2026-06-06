import tempfile
from io import BytesIO

import barcode
from barcode.writer import ImageWriter
from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

FORMATS = {"code128": "code128", "ean13": "ean13", "ean8": "ean8", "code39": "code39"}


@router.post("/")
async def generate(
    content: str = Form(...),
    fmt: str = Form(default="code128"),
):
    fmt = fmt.lower()
    if fmt not in FORMATS:
        raise HTTPException(400, f"Unsupported format. Use: {', '.join(FORMATS)}.")
    if not content.strip():
        raise HTTPException(400, "Content cannot be empty.")

    try:
        writer = ImageWriter()
        bc_class = barcode.get_barcode_class(FORMATS[fmt])
        bc = bc_class(content.strip(), writer=writer)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            bc.write(tmp, options={"write_text": True, "quiet_zone": 2.5})
            path = tmp.name
    except Exception as e:
        raise HTTPException(400, str(e))

    return FileResponse(path, media_type="image/png", filename=f"barcode.png")
