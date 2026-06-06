from datetime import datetime

import whois
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class WhoisRequest(BaseModel):
    domain: str


def _fmt_date(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, list):
        val = val[0]
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    return str(val)


def _first(val):
    if isinstance(val, list):
        return val[0] if val else None
    return val


@router.post("/")
def lookup(req: WhoisRequest):
    domain = req.domain.strip().lower()
    for prefix in ("https://", "http://"):
        if domain.startswith(prefix):
            domain = domain[len(prefix):]
    domain = domain.split("/")[0]

    if not domain:
        raise HTTPException(400, "Enter a valid domain.")

    try:
        w = whois.whois(domain)
    except Exception as e:
        raise HTTPException(400, f"Whois lookup failed: {e}")

    if not w or not w.domain_name:
        raise HTTPException(400, f"No Whois data found for '{domain}'.")

    nameservers = w.name_servers
    if isinstance(nameservers, list):
        nameservers = [ns.lower() for ns in nameservers]
    elif nameservers:
        nameservers = [nameservers.lower()]
    else:
        nameservers = []

    return {
        "domain": domain,
        "registrar": _first(w.registrar),
        "creation_date": _fmt_date(w.creation_date),
        "expiration_date": _fmt_date(w.expiration_date),
        "updated_date": _fmt_date(w.updated_date),
        "status": _first(w.status),
        "nameservers": list(dict.fromkeys(nameservers)),  # deduplicate
        "emails": ([w.emails] if isinstance(w.emails, str) else w.emails or []),
        "org": _first(w.org),
        "country": _first(w.country),
    }
