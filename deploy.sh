#!/usr/bin/env bash
set -e

docker compose -f docker-compose.github.yaml up --build -d
echo "gaia-tools running on http://localhost:3001"
