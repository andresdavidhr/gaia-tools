import io

import pytest
from PIL import Image


# --- helpers ---

def _make_png(w=20, h=20, mode="RGB") -> bytes:
    buf = io.BytesIO()
    Image.new(mode, (w, h), color=(100, 150, 200)).save(buf, format="PNG")
    return buf.getvalue()


def _make_jpeg(w=20, h=20) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), color=(200, 100, 50)).save(buf, format="JPEG")
    return buf.getvalue()


# ============================================================
# EXIF
# ============================================================

def test_api_exif_basic_image_info(client):
    r = client.post(
        "/api/exif/",
        files=[("file", ("img.png", _make_png(), "image/png"))],
    )
    assert r.status_code == 200
    data = r.json()
    assert data["Image"]["Width"] == 20
    assert data["Image"]["Height"] == 20
    assert data["Image"]["Mode"] == "RGB"


def test_api_exif_no_exif_returns_empty_camera(client):
    r = client.post(
        "/api/exif/",
        files=[("file", ("img.png", _make_png(), "image/png"))],
    )
    assert r.status_code == 200
    assert r.json()["Camera"] == {}
    assert r.json()["GPS"] == {}


# ============================================================
# RESIZE
# ============================================================

def test_api_resize_changes_dimensions(client):
    r = client.post(
        "/api/resize/resize",
        data={"width": "10", "height": "10", "keep_ratio": "false"},
        files=[("file", ("img.png", _make_png(20, 20), "image/png"))],
    )
    assert r.status_code == 200
    img = Image.open(io.BytesIO(r.content))
    assert img.size == (10, 10)


def test_api_resize_keep_ratio(client):
    png = _make_png(40, 20)
    r = client.post(
        "/api/resize/resize",
        data={"width": "20", "height": "20", "keep_ratio": "true"},
        files=[("file", ("img.png", png, "image/png"))],
    )
    assert r.status_code == 200
    img = Image.open(io.BytesIO(r.content))
    assert img.width <= 20 and img.height <= 20


def test_api_resize_invalid_dimensions(client):
    r = client.post(
        "/api/resize/resize",
        data={"width": "0", "height": "10", "keep_ratio": "false"},
        files=[("file", ("img.png", _make_png(), "image/png"))],
    )
    assert r.status_code == 400


def test_api_crop_returns_correct_size(client):
    r = client.post(
        "/api/resize/crop",
        data={"x": "0", "y": "0", "width": "10", "height": "10"},
        files=[("file", ("img.png", _make_png(20, 20), "image/png"))],
    )
    assert r.status_code == 200
    img = Image.open(io.BytesIO(r.content))
    assert img.size == (10, 10)


def test_api_crop_out_of_bounds(client):
    r = client.post(
        "/api/resize/crop",
        data={"x": "15", "y": "15", "width": "10", "height": "10"},
        files=[("file", ("img.png", _make_png(20, 20), "image/png"))],
    )
    assert r.status_code == 400


# ============================================================
# BARCODE
# ============================================================

def test_api_barcode_code128(client):
    r = client.post(
        "/api/barcode/",
        data={"content": "hello-world", "fmt": "code128"},
    )
    assert r.status_code == 200
    assert "image/png" in r.headers["content-type"]
    img = Image.open(io.BytesIO(r.content))
    assert img.format == "PNG"


def test_api_barcode_code39(client):
    r = client.post(
        "/api/barcode/",
        data={"content": "HELLO", "fmt": "code39"},
    )
    assert r.status_code == 200


def test_api_barcode_invalid_format(client):
    r = client.post(
        "/api/barcode/",
        data={"content": "test", "fmt": "qr"},
    )
    assert r.status_code == 400


def test_api_barcode_empty_content(client):
    r = client.post(
        "/api/barcode/",
        data={"content": "  ", "fmt": "code128"},
    )
    assert r.status_code == 400


def test_api_barcode_ean13_wrong_length(client):
    # EAN-13 requires exactly 12 digits; this should fail
    r = client.post(
        "/api/barcode/",
        data={"content": "123", "fmt": "ean13"},
    )
    assert r.status_code == 400


# ============================================================
# METADATA REMOVER
# ============================================================

def test_api_metadata_remover_strips_and_downloads(client):
    r = client.post(
        "/api/metadata/",
        files=[("file", ("photo.png", _make_png(), "image/png"))],
    )
    assert r.status_code == 200
    assert "image/png" in r.headers["content-type"]
    assert "x-original-size" in r.headers
    assert "x-cleaned-size" in r.headers
    assert "x-fields-removed" in r.headers


def test_api_metadata_remover_output_is_valid_image(client):
    r = client.post(
        "/api/metadata/",
        files=[("file", ("photo.jpg", _make_jpeg(), "image/jpeg"))],
    )
    assert r.status_code == 200
    img = Image.open(io.BytesIO(r.content))
    assert img.format == "JPEG"
    assert img._getexif() is None


def test_api_metadata_remover_preserves_dimensions(client):
    r = client.post(
        "/api/metadata/",
        files=[("file", ("img.png", _make_png(30, 15), "image/png"))],
    )
    assert r.status_code == 200
    img = Image.open(io.BytesIO(r.content))
    assert img.size == (30, 15)
