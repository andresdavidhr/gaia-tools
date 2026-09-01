import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import (
    downloader, password, converter, qr, hash_gen,
    compress, optimize, pdf, exif, resize, barcode,
    ssl_check, http_headers, dns_lookup, whois_check, metadata_remover,
)

app = FastAPI(title="gaia-tools API", version="1.0.0")

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_BODY_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# En producción el frontend se sirve tras el mismo origen (nginx proxea /api/),
# así que CORS solo hace falta para el dev server de Vite.
CORS_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173",
    ).split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    """Rechaza cuerpos por encima de MAX_FILE_SIZE_MB antes de leerlos.

    Se apoya en Content-Length, que envían todos los clientes normales. Una
    petición chunked lo esquivaría: la barrera dura sigue siendo el
    `client_max_body_size` de nginx, única vía de entrada al backend.
    """
    length = request.headers.get("content-length")
    if length:
        try:
            if int(length) > MAX_BODY_BYTES:
                return JSONResponse(
                    {"detail": f"El fichero supera el límite de {MAX_FILE_SIZE_MB} MB."},
                    status_code=413,
                )
        except ValueError:
            return JSONResponse({"detail": "Content-Length inválido."}, status_code=400)
    return await call_next(request)


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
