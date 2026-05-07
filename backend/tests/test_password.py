import string
from app.utils.password_utils import generate_password


def test_default_length():
    pwd = generate_password(16, True, True)
    assert len(pwd) == 16


def test_custom_length():
    for length in (8, 32, 64, 128):
        assert len(generate_password(length, True, True)) == length


def test_has_uppercase_and_lowercase():
    pwd = generate_password(32, False, False)
    assert any(c.isupper() for c in pwd)
    assert any(c.islower() for c in pwd)


def test_includes_numbers_when_requested():
    pwd = generate_password(32, False, True)
    assert any(c.isdigit() for c in pwd)


def test_excludes_numbers_when_not_requested():
    for _ in range(10):
        pwd = generate_password(32, False, False)
        assert not any(c.isdigit() for c in pwd)


def test_includes_symbols_when_requested():
    pwd = generate_password(32, True, False)
    assert any(c in string.punctuation for c in pwd)


def test_excludes_symbols_when_not_requested():
    for _ in range(10):
        pwd = generate_password(32, False, True)
        assert not any(c in string.punctuation for c in pwd)


def test_api_endpoint(client):
    r = client.get("/api/password/generate?length=20&symbols=true&numbers=true")
    assert r.status_code == 200
    data = r.json()
    assert "password" in data
    assert len(data["password"]) == 20


def test_api_length_bounds(client):
    assert client.get("/api/password/generate?length=7").status_code == 422
    assert client.get("/api/password/generate?length=129").status_code == 422
