#!/usr/bin/env bash
# Rebuilds all service images and redeploys the karaoke stack. Run this ON
# the swarm host (single-node), from the repo root synced to /srv/karaoke.
# Assumes infra/.env already exists there with the real secrets (never
# committed — see .env.example for the shape).
set -euo pipefail
cd "$(dirname "$0")/.."

docker build -t karaoke-api:latest -f apps/api/Dockerfile .
docker build -t karaoke-dsp:latest apps/dsp-service
docker build -t karaoke-landing:latest apps/landing
docker build -t karaoke-venue-panel:latest -f apps/venue-panel/Dockerfile .

cd infra
set -a
source .env
set +a
docker stack deploy -c stack.yml karaoke
