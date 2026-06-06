import io
import re
import tempfile

from pypdf import PdfReader, PdfWriter


def merge_pdfs(files: list[tuple[str, bytes]]) -> str:
    writer = PdfWriter()
    for _, data in files:
        reader = PdfReader(io.BytesIO(data))
        for page in reader.pages:
            writer.add_page(page)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        writer.write(tmp)
        return tmp.name


def split_pdf(data: bytes, pages_expr: str) -> str:
    reader = PdfReader(io.BytesIO(data))
    total = len(reader.pages)
    indices = _parse_pages(pages_expr, total)

    writer = PdfWriter()
    for i in indices:
        writer.add_page(reader.pages[i])

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        writer.write(tmp)
        return tmp.name


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
