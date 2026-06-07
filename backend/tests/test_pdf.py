import io

import pytest
from pypdf import PdfReader, PdfWriter

from app.utils.pdf_utils import _parse_pages, merge_pdfs, split_pdf


def _make_pdf(pages: int = 2) -> bytes:
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=72, height=72)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


# --- unit: _parse_pages ---

def test_parse_pages_single():
    assert _parse_pages("1", 5) == [0]


def test_parse_pages_range():
    assert _parse_pages("1-3", 5) == [0, 1, 2]


def test_parse_pages_mixed():
    assert _parse_pages("1, 3-4", 5) == [0, 2, 3]


def test_parse_pages_out_of_bounds():
    with pytest.raises(ValueError):
        _parse_pages("10", 5)


def test_parse_pages_reversed_range():
    with pytest.raises(ValueError):
        _parse_pages("3-1", 5)


def test_parse_pages_empty():
    with pytest.raises(ValueError):
        _parse_pages("  ", 5)


# --- unit: merge_pdfs ---

def test_merge_pdfs_combines_pages():
    pdf_a = _make_pdf(2)
    pdf_b = _make_pdf(3)
    data = merge_pdfs([("a.pdf", pdf_a), ("b.pdf", pdf_b)])
    assert len(PdfReader(io.BytesIO(data)).pages) == 5


# --- unit: split_pdf ---

def test_split_pdf_extracts_pages():
    pdf = _make_pdf(5)
    data = split_pdf(pdf, "2-4")
    assert len(PdfReader(io.BytesIO(data)).pages) == 3


# --- API ---

def test_api_merge(client):
    pdf = _make_pdf(2)
    r = client.post(
        "/api/pdf/merge",
        files=[
            ("files", ("a.pdf", pdf, "application/pdf")),
            ("files", ("b.pdf", pdf, "application/pdf")),
        ],
    )
    assert r.status_code == 200
    assert "application/pdf" in r.headers["content-type"]
    reader = PdfReader(io.BytesIO(r.content))
    assert len(reader.pages) == 4


def test_api_merge_requires_two_files(client):
    pdf = _make_pdf(1)
    r = client.post(
        "/api/pdf/merge",
        files=[("files", ("a.pdf", pdf, "application/pdf"))],
    )
    assert r.status_code == 400


def test_api_split(client):
    pdf = _make_pdf(5)
    r = client.post(
        "/api/pdf/split",
        data={"pages": "1-3"},
        files=[("file", ("doc.pdf", pdf, "application/pdf"))],
    )
    assert r.status_code == 200
    reader = PdfReader(io.BytesIO(r.content))
    assert len(reader.pages) == 3


def test_api_split_out_of_range(client):
    pdf = _make_pdf(3)
    r = client.post(
        "/api/pdf/split",
        data={"pages": "10"},
        files=[("file", ("doc.pdf", pdf, "application/pdf"))],
    )
    assert r.status_code == 400
