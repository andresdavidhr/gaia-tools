import dns.asyncresolver
import dns.exception
import dns.resolver
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

RECORD_TYPES = {"A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"}


class DNSRequest(BaseModel):
    domain: str
    record_type: str = "A"


def _record_str(rdata, rtype: str) -> str:
    if rtype == "MX":
        return f"{rdata.preference} {rdata.exchange}"
    if rtype == "TXT":
        return b" ".join(rdata.strings).decode(errors="replace")
    return str(rdata)


@router.post("/")
async def lookup(req: DNSRequest):
    domain = req.domain.strip().lower()
    rtype  = req.record_type.upper()

    if not domain:
        raise HTTPException(400, "Enter a domain.")
    if rtype not in RECORD_TYPES:
        raise HTTPException(400, f"Unsupported record type. Use: {', '.join(sorted(RECORD_TYPES))}.")

    try:
        answers = await dns.asyncresolver.resolve(domain, rtype)
        records = [_record_str(r, rtype) for r in answers]
    except dns.resolver.NXDOMAIN:
        raise HTTPException(400, f"Domain '{domain}' not found.")
    except dns.resolver.NoAnswer:
        return {"domain": domain, "record_type": rtype, "records": []}
    except dns.exception.DNSException as e:
        raise HTTPException(400, str(e))

    return {"domain": domain, "record_type": rtype, "records": records}
