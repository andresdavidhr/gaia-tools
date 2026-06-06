import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class HeadersRequest(BaseModel):
    url: str


@router.post("/")
async def fetch_headers(req: HeadersRequest):
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10,
                                     verify=False) as client:
            res = await client.head(url)
    except httpx.TimeoutException:
        raise HTTPException(400, "Request timed out.")
    except httpx.RequestError as e:
        raise HTTPException(400, f"Request failed: {e}")

    return {
        "url": str(res.url),
        "status_code": res.status_code,
        "headers": dict(res.headers),
    }
