from __future__ import annotations

import io
import re

from pypdf import PdfReader, PdfWriter


def merge_pdfs(files: list[tuple[str, bytes]]) -> bytes:
    writer = PdfWriter()
    for _, data in files:
        reader = PdfReader(io.BytesIO(data))
        for page in reader.pages:
            writer.add_page(page)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def split_pdf(data: bytes, pages_expr: str) -> bytes:
    reader = PdfReader(io.BytesIO(data))
    total = len(reader.pages)
    indices = _parse_pages(pages_expr, total)
    writer = PdfWriter()
    for i in indices:
        writer.add_page(reader.pages[i])
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def _parse_pages(expr: str, total: int) -> list[int]:
    indices: list[int] = []
    for part in re.split(r"[,\s]+", expr.strip()):
        if not part:
            continue
        m = re.fullmatch(r"(\d+)-(\d+)", part)
        if m:
            start, end = int(m.group(1)), int(m.group(2))
        else:
            start = end = int(part)
        if start < 1 or end > total or start > end:
            raise ValueError(f"Page range '{part}' is out of bounds (document has {total} pages).")
        indices.extend(range(start - 1, end))
    if not indices:
        raise ValueError("No valid pages specified.")
    return indices
