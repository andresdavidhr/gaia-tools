import os
import subprocess
import tempfile
from io import BytesIO
from PIL import Image
import pypandoc


def convert_image(data: bytes, target_format: str) -> str:
    img = Image.open(BytesIO(data))
    if target_format in ("jpg", "jpeg") and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    tmp = tempfile.NamedTemporaryFile(suffix=f".{target_format}", delete=False)
    fmt_map = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG", "webp": "WEBP", "gif": "GIF"}
    img.save(tmp.name, format=fmt_map[target_format])
    return tmp.name


def _ffmpeg_convert(data: bytes, src_name: str, target_format: str, extra_args: list[str] = []) -> str:
    src_ext = os.path.splitext(src_name)[-1] or ".tmp"
    with tempfile.NamedTemporaryFile(suffix=src_ext, delete=False) as src_file:
        src_file.write(data)
        src_path = src_file.name

    out = tempfile.NamedTemporaryFile(suffix=f".{target_format}", delete=False)
    out.close()

    cmd = ["ffmpeg", "-y", "-i", src_path] + extra_args + [out.name]
    result = subprocess.run(cmd, capture_output=True)
    os.unlink(src_path)

    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode())

    return out.name


def convert_video(data: bytes, src_name: str, target_format: str) -> str:
    return _ffmpeg_convert(data, src_name, target_format)


def convert_audio(data: bytes, src_name: str, target_format: str) -> str:
    extra = ["-b:a", "192k"] if target_format == "mp3" else []
    return _ffmpeg_convert(data, src_name, target_format, extra)


def convert_document(data: bytes, src_name: str, target_format: str) -> str:
    src_ext = os.path.splitext(src_name)[-1].lstrip(".") or "txt"
    with tempfile.NamedTemporaryFile(suffix=f".{src_ext}", delete=False) as src_file:
        src_file.write(data)
        src_path = src_file.name

    out = tempfile.NamedTemporaryFile(suffix=f".{target_format}", delete=False)
    out.close()

    pypandoc.convert_file(src_path, target_format, outputfile=out.name)
    os.unlink(src_path)
    return out.name
