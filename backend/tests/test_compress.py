import io
import tarfile
import zipfile

import pytest

from app.utils.compress_utils import MAX_BYTES, create_tar, create_zip


# --- unit: create_zip ---

def test_create_zip_contains_files():
    path = create_zip([("a.txt", b"hello"), ("b.txt", b"world")], password=None)
    with zipfile.ZipFile(path) as zf:
        assert set(zf.namelist()) == {"a.txt", "b.txt"}
        assert zf.read("a.txt") == b"hello"


def test_create_zip_with_password():
    path = create_zip([("secret.txt", b"data")], password="pass123")
    with zipfile.ZipFile(path) as zf:
        # Reading without password should raise BadZipFile or RuntimeError
        with pytest.raises((RuntimeError, zipfile.BadZipFile)):
            zf.read("secret.txt")


def test_create_zip_size_limit():
    big = b"x" * (MAX_BYTES + 1)
    with pytest.raises(ValueError, match="100 MB"):
        create_zip([("big.bin", big)], password=None)


# --- unit: create_tar ---

def test_create_tar_plain():
    path = create_tar([("a.txt", b"hello")], compression="")
    with tarfile.open(path, "r") as tf:
        member = tf.getmember("a.txt")
        assert member.size == 5


def test_create_tar_gz():
    path = create_tar([("f.txt", b"data")], compression="gz")
    with tarfile.open(path, "r:gz") as tf:
        assert tf.getmember("f.txt").size == 4


def test_create_tar_bz2():
    path = create_tar([("f.txt", b"data")], compression="bz2")
    with tarfile.open(path, "r:bz2") as tf:
        assert tf.getmember("f.txt").size == 4


def test_create_tar_size_limit():
    big = b"x" * (MAX_BYTES + 1)
    with pytest.raises(ValueError, match="100 MB"):
        create_tar([("big.bin", big)], compression="")


# --- API ---

def test_api_compress_zip(client):
    r = client.post(
        "/api/compress/",
        data={"fmt": "zip"},
        files=[
            ("files", ("a.txt", b"hello", "text/plain")),
            ("files", ("b.txt", b"world", "text/plain")),
        ],
    )
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/zip"
    with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
        assert "a.txt" in zf.namelist()


def test_api_compress_tar_gz(client):
    r = client.post(
        "/api/compress/",
        data={"fmt": "tar.gz"},
        files=[("files", ("f.txt", b"data", "text/plain"))],
    )
    assert r.status_code == 200
    with tarfile.open(fileobj=io.BytesIO(r.content), mode="r:gz") as tf:
        assert "f.txt" in tf.getnames()


def test_api_compress_invalid_format(client):
    r = client.post(
        "/api/compress/",
        data={"fmt": "rar"},
        files=[("files", ("f.txt", b"x", "text/plain"))],
    )
    assert r.status_code == 400


def test_api_compress_password_on_non_zip(client):
    r = client.post(
        "/api/compress/",
        data={"fmt": "tar", "password": "secret"},
        files=[("files", ("f.txt", b"x", "text/plain"))],
    )
    assert r.status_code == 400
