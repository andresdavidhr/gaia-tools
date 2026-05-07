#!/usr/bin/env bash
set -e

COMPOSE_FILE="docker-compose.github.yaml"

if [ ! -f .env ]; then
  cat > .env << 'EOF'
BACKEND_PORT=8000
FRONTEND_PORT=3000
MAX_FILE_SIZE_MB=100
EOF
  echo ".env created with default values."
fi

docker compose -f "$COMPOSE_FILE" up --build -d
echo "gaia-tools running on http://localhost:$(grep FRONTEND_PORT .env | cut -d= -f2)"
