from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import downloader, password, converter, qr, hash_gen

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


@app.get("/health")
def health():
    return {"status": "ok"}
