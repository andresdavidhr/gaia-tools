#!/bin/sh
set -e

echo "==> Ejecutando tests..."
pytest tests/ -v -m "not integration"
echo "==> Tests superados. Arrancando servidor..."

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
