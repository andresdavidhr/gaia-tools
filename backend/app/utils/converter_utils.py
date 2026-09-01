from __future__ import annotations


import os
import subprocess
import tempfile
from io import BytesIO
from PIL import Image

# Un fichero corrupto o un códec patológico pueden dejar a ffmpeg/pandoc
# girando indefinidamente: sin timeout el worker queda colgado para siempre.
FFMPEG_TIMEOUT = 600   # 10 min
PANDOC_TIMEOUT = 120   # 2 min


class ConversionError(RuntimeError):
    """Fallo de conversión con detalle interno (no apto para el cliente)."""


def _new_temp(suffix: str) -> str:
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp.close()
    return tmp.name


def _discard(path: str) -> None:
    try:
        os.unlink(path)
    except OSError:
        pass


def convert_image(data: bytes, target_format: str) -> str:
    img = Image.open(BytesIO(data))
    if target_format in ("jpg", "jpeg") and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    fmt_map = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG", "webp": "WEBP", "gif": "GIF"}
    out = _new_temp(f".{target_format}")
    try:
        img.save(out, format=fmt_map[target_format])
    except Exception:
        _discard(out)
        raise
    return out


def _run(cmd: list[str], timeout: int, tool: str) -> None:
    try:
        result = subprocess.run(cmd, capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise ConversionError(f"{tool} excedió el límite de {timeout}s.")
    if result.returncode != 0:
        stderr = (result.stderr or b"").decode(errors="replace")
        raise ConversionError(f"{tool} falló: {stderr}")


def _ffmpeg_convert(data: bytes, src_name: str, target_format: str,
                    extra_args: list[str] | None = None) -> str:
    src_ext = os.path.splitext(src_name)[-1] or ".tmp"
    with tempfile.NamedTemporaryFile(suffix=src_ext, delete=False) as src_file:
        src_file.write(data)
        src_path = src_file.name

    out = _new_temp(f".{target_format}")
    cmd = ["ffmpeg", "-y", "-i", src_path] + (extra_args or []) + [out]

    try:
        _run(cmd, FFMPEG_TIMEOUT, "ffmpeg")
    except Exception:
        _discard(out)
        raise
    finally:
        _discard(src_path)

    return out


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

    out = _new_temp(f".{target_format}")

    try:
        _run(["pandoc", src_path, "-o", out], PANDOC_TIMEOUT, "pandoc")
    except Exception:
        _discard(out)
        raise
    finally:
        _discard(src_path)

    return out
