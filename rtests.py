#!/usr/bin/env python3
"""
Pre-flight checks + full test suite runner.

Verifies that:
  1. Required backend source files exist (architecture check)
  2. All Python dependencies from requirements.txt are importable
Then runs pytest.
"""

import importlib.util
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
BACKEND = ROOT / "backend"

OK  = "\033[92m✓\033[0m"
ERR = "\033[91m✗\033[0m"
WARN = "\033[93m!\033[0m"

errors = 0


def check(label: str, ok: bool, detail: str = "") -> None:
    global errors
    if ok:
        print(f"  {OK}  {label}")
    else:
        print(f"  {ERR}  {label}" + (f": {detail}" if detail else ""))
        errors += 1


# ── 1. Architecture: required files ──────────────────────────────────────────

print("\n── Architecture ─────────────────────────────────────────────────────")

REQUIRED_ROUTERS = [
    "downloader", "password", "converter", "qr", "hash_gen",
    "compress", "optimize", "pdf", "exif", "resize", "barcode",
    "ssl_check", "http_headers", "dns_lookup", "whois_check", "metadata_remover",
]

REQUIRED_PAGES = [
    "Home", "Downloads", "Generator", "Conversor", "QRCode", "TextUtils",
    "HashGen", "JSONFormatter", "Compressor", "Base64", "JWTDecoder", "Diff",
    "ImageOptimizer", "PDFTool", "Cron", "ColorTool", "EXIF", "Resize",
    "Barcode", "SSLChecker", "HTTPHeaders", "DNSLookup", "Whois",
    "MetadataRemover", "SQLFormatter",
]

for name in REQUIRED_ROUTERS:
    path = BACKEND / "app" / "routers" / f"{name}.py"
    check(f"backend/app/routers/{name}.py", path.exists())

for name in REQUIRED_PAGES:
    path = ROOT / "frontend" / "src" / "pages" / f"{name}.jsx"
    check(f"frontend/src/pages/{name}.jsx", path.exists())

check("backend/app/main.py",      (BACKEND / "app" / "main.py").exists())
check("backend/requirements.txt", (BACKEND / "requirements.txt").exists())
check("frontend/nginx.conf",      (ROOT / "frontend" / "nginx.conf").exists())


# ── 2. Dependencies: importable packages ─────────────────────────────────────

print("\n── Dependencies ─────────────────────────────────────────────────────")

# Map: package_name_in_requirements -> importable_module_name
PACKAGES = {
    "fastapi":           "fastapi",
    "uvicorn":           "uvicorn",
    "python-multipart":  "multipart",
    "Pillow":            "PIL",
    "qrcode":            "qrcode",
    "httpx":             "httpx",
    "pytest":            "pytest",
    "pytest-asyncio":    "pytest_asyncio",
    "pyzipper":          "pyzipper",
    "pypdf":             "pypdf",
    "python-barcode":    "barcode",
    "dnspython":         "dns",
    "python-whois":      "whois",
    "yt-dlp":            "yt_dlp",
}

for req_name, module_name in PACKAGES.items():
    found = importlib.util.find_spec(module_name) is not None
    check(req_name, found, f"run: pip install -r backend/requirements.txt" if not found else "")

# pandoc and ffmpeg are system binaries (installed in the image), not packages
for binary, tool in (("pandoc", "document converter"), ("ffmpeg", "audio/video converter")):
    if shutil.which(binary):
        print(f"  {OK}  {binary} (system binary)")
    else:
        print(f"  {WARN}  {binary}  (optional \u2014 {tool} needs it)")


# ── Summary ───────────────────────────────────────────────────────────────────

if errors:
    print(f"\n{errors} pre-flight check(s) failed. Fix them before running tests.\n")
    sys.exit(1)

print("\n── Running tests ────────────────────────────────────────────────────\n")

result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short"],
    cwd=BACKEND,
)

sys.exit(result.returncode)
