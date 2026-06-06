import io

from PIL import Image


def _make_jpeg(w=50, h=50) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), color=(200, 100, 50)).save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def _make_png(w=50, h=50) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), color=(100, 200, 50)).save(buf, format="PNG")
    return buf.getvalue()


def test_api_optimize_jpeg_returns_image(client):
    r = client.post(
        "/api/optimize/",
        data={"quality": "60"},
        files=[("file", ("photo.jpg", _make_jpeg(), "image/jpeg"))],
    )
    assert r.status_code == 200
    assert "image/jpeg" in r.headers["content-type"]
    assert "x-original-size" in r.headers
    assert "x-compressed-size" in r.headers


def test_api_optimize_png(client):
    r = client.post(
        "/api/optimize/",
        data={"quality": "80"},
        files=[("file", ("img.png", _make_png(), "image/png"))],
    )
    assert r.status_code == 200
    assert "image/png" in r.headers["content-type"]


def test_api_optimize_reduces_size(client):
    original = _make_jpeg(200, 200)
    r = client.post(
        "/api/optimize/",
        data={"quality": "10"},
        files=[("file", ("photo.jpg", original, "image/jpeg"))],
    )
    assert r.status_code == 200
    compressed = int(r.headers["x-compressed-size"])
    original_reported = int(r.headers["x-original-size"])
    assert original_reported == len(original)
    assert compressed < original_reported


def test_api_optimize_unsupported_format(client):
    r = client.post(
        "/api/optimize/",
        data={"quality": "80"},
        files=[("file", ("img.bmp", b"fake", "image/bmp"))],
    )
    assert r.status_code == 400


def test_api_optimize_invalid_quality(client):
    r = client.post(
        "/api/optimize/",
        data={"quality": "0"},
        files=[("file", ("photo.jpg", _make_jpeg(), "image/jpeg"))],
    )
    assert r.status_code == 400
