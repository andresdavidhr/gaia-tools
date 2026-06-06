import socket
import ssl
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

DATE_FMT = "%b %d %H:%M:%S %Y %Z"


class SSLRequest(BaseModel):
    hostname: str


def _clean_hostname(raw: str) -> str:
    raw = raw.strip().lower()
    for prefix in ("https://", "http://"):
        if raw.startswith(prefix):
            raw = raw[len(prefix):]
    return raw.split("/")[0].split(":")[0]


@router.post("/")
def check(req: SSLRequest):
    hostname = _clean_hostname(req.hostname)
    if not hostname:
        raise HTTPException(400, "Enter a valid hostname.")

    # Fetch cert without hostname verification so we always get data
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_OPTIONAL

    try:
        with socket.create_connection((hostname, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as tls:
                cert = tls.getpeercert()
                cipher = tls.cipher()
    except (socket.gaierror, socket.timeout, ConnectionRefusedError) as e:
        raise HTTPException(400, f"Could not connect to {hostname}: {e}")
    except ssl.SSLError as e:
        raise HTTPException(400, f"SSL error: {e}")

    if not cert:
        raise HTTPException(400, "No certificate returned by server.")

    # Parse dates
    not_before = datetime.strptime(cert["notBefore"], DATE_FMT).replace(tzinfo=timezone.utc)
    not_after  = datetime.strptime(cert["notAfter"],  DATE_FMT).replace(tzinfo=timezone.utc)
    now        = datetime.now(timezone.utc)
    days_left  = (not_after - now).days

    # Subject / issuer
    subject = {k: v for tup in cert.get("subject", ()) for k, v in tup}
    issuer  = {k: v for tup in cert.get("issuer",  ()) for k, v in tup}

    # SANs
    sans = [v for typ, v in cert.get("subjectAltName", ()) if typ == "DNS"]

    # Validity check
    valid = ctx.verify_mode != ssl.CERT_NONE
    try:
        ctx2 = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=10) as s2:
            with ctx2.wrap_socket(s2, server_hostname=hostname):
                pass
        trusted = True
    except ssl.SSLError:
        trusted = False

    return {
        "hostname": hostname,
        "trusted": trusted,
        "days_left": days_left,
        "expired": days_left < 0,
        "subject_cn": subject.get("commonName", ""),
        "issuer_o": issuer.get("organizationName", issuer.get("commonName", "")),
        "issuer_cn": issuer.get("commonName", ""),
        "not_before": not_before.strftime("%Y-%m-%d"),
        "not_after":  not_after.strftime("%Y-%m-%d"),
        "sans": sans,
        "cipher": cipher[0] if cipher else "",
        "tls_version": cipher[1] if cipher else "",
    }
