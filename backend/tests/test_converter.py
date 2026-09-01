import io
import pytest
from PIL import Image
from unittest.mock import patch
from app.utils.converter_utils import convert_image


def _make_png() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color=(255, 0, 0)).save(buf, format="PNG")
    return buf.getvalue()


def _make_rgba_png() -> bytes:
    buf = io.BytesIO()
    Image.new("RGBA", (10, 10), color=(255, 0, 0, 128)).save(buf, format="PNG")
    return buf.getvalue()


# --- Image converter unit tests ---

def test_convert_image_png_to_jpg():
    out = convert_image(_make_png(), "jpg")
    img = Image.open(out)
    assert img.format == "JPEG"


def test_convert_image_rgba_to_jpg_strips_alpha():
    out = convert_image(_make_rgba_png(), "jpg")
    img = Image.open(out)
    assert img.mode == "RGB"


def test_convert_image_png_to_webp():
    out = convert_image(_make_png(), "webp")
    img = Image.open(out)
    assert img.format == "WEBP"


# --- Image converter API tests ---

def test_api_image_unsupported_format(client):
    data = {"target_format": "bmp"}
    files = {"file": ("test.png", _make_png(), "image/png")}
    r = client.post("/api/convert/image", data=data, files=files)
    assert r.status_code == 400


def test_api_image_png_to_jpg(client):
    data = {"target_format": "jpg"}
    files = {"file": ("test.png", _make_png(), "image/png")}
    r = client.post("/api/convert/image", data=data, files=files)
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/jpeg"


# --- Video/Audio/Document converter API tests (mocked ffmpeg/pandoc) ---

def test_api_video_conversion(client, tmp_path):
    out_file = tmp_path / "resultado.mp4"
    out_file.write_bytes(b"fake video")

    with patch("app.routers.converter.convert_video", return_value=str(out_file)):
        data = {"target_format": "mp4"}
        files = {"file": ("test.avi", b"fake avi", "video/x-msvideo")}
        r = client.post("/api/convert/video", data=data, files=files)

    assert r.status_code == 200
    assert r.headers["content-type"] == "video/mp4"


@patch("app.utils.converter_utils.subprocess.run")
def test_api_audio_ffmpeg_error_returns_500(mock_run, client):
    mock_run.return_value.returncode = 1
    mock_run.return_value.stderr = b"codec error"

    data = {"target_format": "mp3"}
    files = {"file": ("test.wav", b"fake wav", "audio/wav")}
    r = client.post("/api/convert/audio", data=data, files=files)
    assert r.status_code == 500


def test_api_document_unsupported_format(client):
    data = {"target_format": "odt"}
    files = {"file": ("doc.txt", b"hello", "text/plain")}
    r = client.post("/api/convert/document", data=data, files=files)
    assert r.status_code == 400


# --- Temp file cleanup (los temporales servidos se acumulaban en /tmp) ---

def test_api_image_removes_temp_file(client, tmp_path):
    out_file = tmp_path / "resultado.jpg"
    out_file.write_bytes(b"fake jpeg")

    with patch("app.routers.converter.convert_image", return_value=str(out_file)):
        r = client.post("/api/convert/image",
                        data={"target_format": "jpg"},
                        files={"file": ("test.png", _make_png(), "image/png")})

    assert r.status_code == 200
    assert not out_file.exists()


def test_api_video_removes_temp_file(client, tmp_path):
    out_file = tmp_path / "resultado.mp4"
    out_file.write_bytes(b"fake video")

    with patch("app.routers.converter.convert_video", return_value=str(out_file)):
        r = client.post("/api/convert/video",
                        data={"target_format": "mp4"},
                        files={"file": ("test.avi", b"fake avi", "video/x-msvideo")})

    assert r.status_code == 200
    assert not out_file.exists()
