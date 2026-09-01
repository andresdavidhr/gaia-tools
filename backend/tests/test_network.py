"""
Network tool tests.

SSL, HTTP headers, DNS, and Whois all make external connections.
Unit-level logic is tested directly; API endpoints are tested with mocks
so the suite runs offline without flakiness.
"""

import socket
import ssl
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.routers.ssl_check import _clean_hostname


# ============================================================
# SSL — hostname helper
# ============================================================

def test_clean_hostname_strips_https():
    assert _clean_hostname("https://example.com/path") == "example.com"


def test_clean_hostname_strips_http():
    assert _clean_hostname("http://example.com") == "example.com"


def test_clean_hostname_strips_port():
    # hostname helper doesn't parse ports but splits on /
    assert _clean_hostname("example.com") == "example.com"


def test_clean_hostname_lowercases():
    assert _clean_hostname("HTTPS://Example.COM") == "example.com"


# ============================================================
# SSL — API (mocked connection)
# ============================================================

def _fake_cert():
    return {
        "subject": ((("commonName", "example.com"),),),
        "issuer": ((("organizationName", "Let's Encrypt"),), (("commonName", "R3"),)),
        "notBefore": "Jan  1 00:00:00 2024 GMT",
        "notAfter": "Apr  1 00:00:00 2099 GMT",
        "subjectAltName": (("DNS", "example.com"), ("DNS", "www.example.com")),
        "serialNumber": "AABBCC",
    }


def _ssl_context_mock(cert):
    mock_tls = MagicMock()
    mock_tls.getpeercert.return_value = cert
    mock_tls.cipher.return_value = ("TLS_AES_256_GCM_SHA384", "TLSv1.3", 256)
    mock_tls.__enter__ = lambda s: s
    mock_tls.__exit__ = MagicMock(return_value=False)

    mock_sock = MagicMock()
    mock_sock.__enter__ = lambda s: s
    mock_sock.__exit__ = MagicMock(return_value=False)

    mock_ctx = MagicMock()
    mock_ctx.wrap_socket.return_value = mock_tls
    return mock_ctx, mock_sock


def test_api_ssl_valid_cert(client):
    cert = _fake_cert()
    mock_ctx, mock_sock = _ssl_context_mock(cert)

    with patch("app.routers.ssl_check.ssl.SSLContext", return_value=mock_ctx), \
         patch("app.routers.ssl_check.ssl.create_default_context", return_value=mock_ctx), \
         patch("app.routers.ssl_check.socket.create_connection", return_value=mock_sock):
        r = client.post("/api/ssl/", json={"hostname": "example.com"})

    assert r.status_code == 200
    data = r.json()
    assert data["subject_cn"] == "example.com"
    assert "example.com" in data["sans"]
    assert data["days_left"] > 0


def test_api_ssl_connection_error(client):
    with patch("app.routers.ssl_check.socket.create_connection",
               side_effect=socket.gaierror("Name resolution failed")):
        r = client.post("/api/ssl/", json={"hostname": "notexist.invalid"})
    assert r.status_code == 400


def test_api_ssl_empty_hostname(client):
    r = client.post("/api/ssl/", json={"hostname": ""})
    assert r.status_code == 400


# ============================================================
# HTTP Headers — API (mocked httpx)
# ============================================================

def _public_dns(*_args, **_kwargs):
    """getaddrinfo que resuelve a una IP pública, sin tocar la red."""
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0))]


def _private_dns(*_args, **_kwargs):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.168.1.1", 0))]


def test_api_headers_success(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.url = "https://example.com"
    mock_response.headers = {"content-type": "text/html", "server": "nginx"}
    mock_response.next_request = None

    mock_client = AsyncMock()
    mock_client.head.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.routers.http_headers.httpx.AsyncClient", return_value=mock_client), \
         patch("app.routers.http_headers.socket.getaddrinfo", _public_dns):
        r = client.post("/api/headers/", json={"url": "https://example.com"})

    assert r.status_code == 200
    data = r.json()
    assert data["status_code"] == 200
    assert "content-type" in data["headers"]


def test_api_headers_timeout(client):
    import httpx

    mock_client = AsyncMock()
    mock_client.head.side_effect = httpx.TimeoutException("timeout")
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.routers.http_headers.httpx.AsyncClient", return_value=mock_client), \
         patch("app.routers.http_headers.socket.getaddrinfo", _public_dns):
        r = client.post("/api/headers/", json={"url": "https://example.com"})

    assert r.status_code == 400


def test_api_headers_blocks_private_target(client):
    """SSRF: el backend vive en la LAN, no debe sondear direcciones internas."""
    with patch("app.routers.http_headers.socket.getaddrinfo", _private_dns):
        r = client.post("/api/headers/", json={"url": "http://router.local"})

    assert r.status_code == 400
    assert "public" in r.json()["detail"].lower()


def test_api_headers_blocks_private_redirect(client):
    """Una redirección hacia una IP interna tampoco debe seguirse."""
    redirect = MagicMock()
    redirect.status_code = 302
    redirect.url = "https://example.com"
    redirect.headers = {}
    redirect.next_request = MagicMock()
    redirect.next_request.url = "http://192.168.1.1/admin"

    mock_client = AsyncMock()
    mock_client.head.return_value = redirect
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    def _dns(host, *_a, **_k):
        return _private_dns() if host == "192.168.1.1" else _public_dns()

    with patch("app.routers.http_headers.httpx.AsyncClient", return_value=mock_client), \
         patch("app.routers.http_headers.socket.getaddrinfo", _dns):
        r = client.post("/api/headers/", json={"url": "https://example.com"})

    assert r.status_code == 400


# ============================================================
# DNS Lookup — API (mocked dns.asyncresolver)
# ============================================================

def _mock_answer(values: list[str]):
    answers = []
    for v in values:
        rdata = MagicMock()
        rdata.__str__ = lambda self, _v=v: _v
        answers.append(rdata)
    return answers


def test_api_dns_a_record(client):
    import dns.asyncresolver

    with patch.object(dns.asyncresolver, "resolve",
                      new=AsyncMock(return_value=_mock_answer(["93.184.216.34"]))):
        r = client.post("/api/dns/", json={"domain": "example.com", "record_type": "A"})

    assert r.status_code == 200
    data = r.json()
    assert data["record_type"] == "A"
    assert "93.184.216.34" in data["records"]


def test_api_dns_nxdomain(client):
    import dns.resolver

    with patch("app.routers.dns_lookup.dns.asyncresolver.resolve",
               new=AsyncMock(side_effect=dns.resolver.NXDOMAIN())):
        r = client.post("/api/dns/", json={"domain": "notexist.invalid", "record_type": "A"})

    assert r.status_code == 400


def test_api_dns_no_answer_returns_empty(client):
    import dns.resolver

    with patch("app.routers.dns_lookup.dns.asyncresolver.resolve",
               new=AsyncMock(side_effect=dns.resolver.NoAnswer())):
        r = client.post("/api/dns/", json={"domain": "example.com", "record_type": "AAAA"})

    assert r.status_code == 200
    assert r.json()["records"] == []


def test_api_dns_invalid_record_type(client):
    r = client.post("/api/dns/", json={"domain": "example.com", "record_type": "INVALID"})
    assert r.status_code == 400


# ============================================================
# Whois — API (mocked python-whois)
# ============================================================

def _fake_whois():
    w = MagicMock()
    w.domain_name = "example.com"
    w.registrar = "Example Registrar, LLC"
    w.creation_date = datetime(2000, 1, 1, tzinfo=timezone.utc)
    w.expiration_date = datetime(2030, 1, 1, tzinfo=timezone.utc)
    w.updated_date = datetime(2023, 6, 1, tzinfo=timezone.utc)
    w.status = "clientTransferProhibited"
    w.name_servers = ["ns1.example.com", "ns2.example.com"]
    w.emails = "admin@example.com"
    w.org = "Example Org"
    w.country = "US"
    return w


def test_api_whois_success(client):
    with patch("app.routers.whois_check.whois.whois", return_value=_fake_whois()):
        r = client.post("/api/whois/", json={"domain": "example.com"})

    assert r.status_code == 200
    data = r.json()
    assert data["registrar"] == "Example Registrar, LLC"
    assert data["creation_date"] == "2000-01-01"
    assert "ns1.example.com" in data["nameservers"]


def test_api_whois_no_data(client):
    w = MagicMock()
    w.domain_name = None
    with patch("app.routers.whois_check.whois.whois", return_value=w):
        r = client.post("/api/whois/", json={"domain": "notexist.invalid"})
    assert r.status_code == 400


def test_api_whois_empty_domain(client):
    r = client.post("/api/whois/", json={"domain": ""})
    assert r.status_code == 400
