from app.utils.hash_utils import compute


def test_known_md5():
    result = compute(b"hello")
    assert result["md5"] == "5d41402abc4b2a76b9719d911017c592"


def test_known_sha256():
    result = compute(b"hello")
    assert result["sha256"] == "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"


def test_returns_all_three_hashes():
    result = compute(b"test")
    assert "md5" in result and "sha1" in result and "sha256" in result


def test_api_hash_text(client):
    r = client.post("/api/hash/generate", data={"text": "hello"})
    assert r.status_code == 200
    data = r.json()
    assert data["md5"] == "5d41402abc4b2a76b9719d911017c592"
    assert "sha1" in data and "sha256" in data


def test_api_hash_file(client):
    r = client.post("/api/hash/generate", files={"file": ("test.txt", b"hello", "text/plain")})
    assert r.status_code == 200
    assert r.json()["md5"] == "5d41402abc4b2a76b9719d911017c592"


def test_api_hash_no_input(client):
    r = client.post("/api/hash/generate")
    assert r.status_code == 400
