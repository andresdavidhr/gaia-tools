import ipaddress
import os
import socket
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

router = APIRouter()

MAX_REDIRECTS = 5

# El backend vive dentro de la LAN: sin este filtro, cualquiera con acceso a la
# web puede usarlo de proxy para sondear el router, el propio NAS u otros
# contenedores. Se puede desactivar a propósito para inspeccionar servicios
# internos propios.
ALLOW_PRIVATE_TARGETS = os.getenv("ALLOW_PRIVATE_TARGETS", "").lower() in ("1", "true", "yes")


class HeadersRequest(BaseModel):
    url: str


def _resolve(host: str) -> list[str]:
    try:
        return [info[4][0] for info in socket.getaddrinfo(host, None)]
    except socket.gaierror:
        raise HTTPException(400, f"Could not resolve '{host}'.")


def _assert_allowed(url: str) -> None:
    """Rechaza destinos que no sean IPs públicas (SSRF)."""
    if ALLOW_PRIVATE_TARGETS:
        return

    host = urlparse(url).hostname
    if not host:
        raise HTTPException(400, "Invalid URL.")

    for addr in _resolve(host):
        ip = ipaddress.ip_address(addr)
        if (ip.is_private or ip.is_loopback or ip.is_link_local
                or ip.is_reserved or ip.is_multicast or ip.is_unspecified):
            raise HTTPException(400, "Only public hosts can be inspected.")


@router.post("/")
async def fetch_headers(req: HeadersRequest):
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        # Sin follow_redirects: cada salto se valida antes de seguirlo, o una
        # redirección bastaría para saltarse el filtro.
        async with httpx.AsyncClient(follow_redirects=False, timeout=10,
                                     verify=False) as client:
            for _ in range(MAX_REDIRECTS):
                await run_in_threadpool(_assert_allowed, url)
                res = await client.head(url)
                if res.next_request is None:
                    break
                url = str(res.next_request.url)
            else:
                raise HTTPException(400, "Too many redirects.")
    except httpx.TimeoutException:
        raise HTTPException(400, "Request timed out.")
    except httpx.RequestError as e:
        raise HTTPException(400, f"Request failed: {e}")

    return {
        "url": str(res.url),
        "status_code": res.status_code,
        "headers": dict(res.headers),
    }
