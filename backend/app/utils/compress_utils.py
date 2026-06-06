from __future__ import annotations

import io
import tarfile
import tempfile
import zipfile

import pyzipper

MAX_BYTES = 100 * 1024 * 1024  # 100 MB


def _validate_size(files: list[tuple[str, bytes]]) -> None:
    for name, data in files:
        if len(data) > MAX_BYTES:
            raise ValueError(f"'{name}' exceeds the 100 MB limit.")


def create_zip(files: list[tuple[str, bytes]], password: str | None) -> str:
    _validate_size(files)
    suffix = ".zip"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        path = tmp.name

    if password:
        with pyzipper.AESZipFile(path, "w", compression=pyzipper.ZIP_DEFLATED,
                                 encryption=pyzipper.WZ_AES) as zf:
            zf.setpassword(password.encode())
            for name, data in files:
                zf.writestr(name, data)
    else:
        with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for name, data in files:
                zf.writestr(name, data)

    return path


def create_tar(files: list[tuple[str, bytes]], compression: str) -> str:
    _validate_size(files)
    ext_map = {"": ".tar", "gz": ".tar.gz", "bz2": ".tar.bz2"}
    mode_map = {"": "w", "gz": "w:gz", "bz2": "w:bz2"}

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext_map[compression]) as tmp:
        path = tmp.name

    with tarfile.open(path, mode_map[compression]) as tf:
        for name, data in files:
            info = tarfile.TarInfo(name=name)
            info.size = len(data)
            tf.addfile(info, io.BytesIO(data))

    return path
