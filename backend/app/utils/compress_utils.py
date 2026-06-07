from __future__ import annotations

import io
import tarfile
import zipfile

import pyzipper

MAX_BYTES = 100 * 1024 * 1024  # 100 MB


def _validate_size(files: list[tuple[str, bytes]]) -> None:
    for name, data in files:
        if len(data) > MAX_BYTES:
            raise ValueError(f"'{name}' exceeds the 100 MB limit.")


def create_zip(files: list[tuple[str, bytes]], password: str | None) -> bytes:
    _validate_size(files)
    buf = io.BytesIO()
    if password:
        with pyzipper.AESZipFile(buf, "w", compression=pyzipper.ZIP_DEFLATED,
                                 encryption=pyzipper.WZ_AES) as zf:
            zf.setpassword(password.encode())
            for name, data in files:
                zf.writestr(name, data)
    else:
        with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for name, data in files:
                zf.writestr(name, data)
    return buf.getvalue()


def create_tar(files: list[tuple[str, bytes]], compression: str) -> bytes:
    _validate_size(files)
    mode_map = {"": "w", "gz": "w:gz", "bz2": "w:bz2"}
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode=mode_map[compression]) as tf:
        for name, data in files:
            info = tarfile.TarInfo(name=name)
            info.size = len(data)
            tf.addfile(info, io.BytesIO(data))
    return buf.getvalue()
