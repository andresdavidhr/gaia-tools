from app.utils.qr_utils import generate_qr
from PIL import Image


def test_generate_qr_returns_png():
    path = generate_qr("https://github.com", "M")
    img = Image.open(path)
    assert img.format == "PNG"


def test_generate_qr_sizes():
    small = Image.open(generate_qr("test", "S"))
    large = Image.open(generate_qr("test", "L"))
    assert large.width > small.width


def test_api_qr_ok(client):
    r = client.post("/api/qr/generate", json={"text": "https://github.com", "size": "M"})
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    assert len(r.content) > 0


def test_api_qr_empty_text(client):
    r = client.post("/api/qr/generate", json={"text": "  ", "size": "M"})
    assert r.status_code == 400


def test_api_qr_invalid_size(client):
    r = client.post("/api/qr/generate", json={"text": "hello", "size": "XL"})
    assert r.status_code == 400
