#!/usr/bin/env bash
set -e

export CACHEBUST=$(date +%s)
echo "Deploying with cache bust: $CACHEBUST"

docker compose -f docker-compose.github.yaml build
docker compose -f docker-compose.github.yaml up -d
echo "gaia-tools running on http://localhost:3001"
