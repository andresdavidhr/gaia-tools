from io import BytesIO

import barcode
from barcode.writer import ImageWriter
from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import Response

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
        buf = BytesIO()
        writer = ImageWriter()
        bc_class = barcode.get_barcode_class(FORMATS[fmt])
        bc = bc_class(content.strip(), writer=writer)
        bc.write(buf, options={"write_text": True, "quiet_zone": 2.5})
        png_bytes = buf.getvalue()
    except Exception as e:
        raise HTTPException(400, str(e))

    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": 'attachment; filename="barcode.png"'},
    )
