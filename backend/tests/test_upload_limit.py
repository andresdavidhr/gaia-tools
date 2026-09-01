"""Límite de tamaño de subida (MAX_FILE_SIZE_MB)."""

from app.main import MAX_BODY_BYTES


def test_oversized_body_rejected(client):
    r = client.post(
        "/api/compress/",
        headers={"content-length": str(MAX_BODY_BYTES + 1)},
        files={"files": ("big.bin", b"x", "application/octet-stream")},
        data={"fmt": "zip"},
    )
    assert r.status_code == 413


def test_normal_body_accepted(client):
    r = client.post(
        "/api/compress/",
        files={"files": ("small.txt", b"hello", "text/plain")},
        data={"fmt": "zip"},
    )
    assert r.status_code == 200
