from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    downloader, password, converter, qr, hash_gen,
    compress, optimize, pdf, exif, resize, barcode,
    ssl_check, http_headers, dns_lookup, whois_check, metadata_remover,
)

app = FastAPI(title="gaia-tools API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(downloader.router, prefix="/api/downloader", tags=["downloader"])
app.include_router(password.router, prefix="/api/password", tags=["password"])
app.include_router(converter.router, prefix="/api/convert", tags=["converter"])
app.include_router(qr.router, prefix="/api/qr", tags=["qr"])
app.include_router(hash_gen.router, prefix="/api/hash", tags=["hash"])
app.include_router(compress.router, prefix="/api/compress", tags=["compress"])
app.include_router(optimize.router, prefix="/api/optimize", tags=["optimize"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["pdf"])
app.include_router(exif.router, prefix="/api/exif", tags=["exif"])
app.include_router(resize.router, prefix="/api/resize", tags=["resize"])
app.include_router(barcode.router,           prefix="/api/barcode",   tags=["barcode"])
app.include_router(ssl_check.router,         prefix="/api/ssl",       tags=["ssl"])
app.include_router(http_headers.router,      prefix="/api/headers",   tags=["headers"])
app.include_router(dns_lookup.router,        prefix="/api/dns",       tags=["dns"])
app.include_router(whois_check.router,       prefix="/api/whois",     tags=["whois"])
app.include_router(metadata_remover.router,  prefix="/api/metadata",  tags=["metadata"])


@app.get("/health")
def health():
    return {"status": "ok"}
