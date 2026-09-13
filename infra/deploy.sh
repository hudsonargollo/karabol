#!/usr/bin/env bash
# Rebuilds all service images and redeploys the karaoke stack. Run this ON
# the swarm host (single-node), from the repo root synced to /srv/karaoke.
# Assumes infra/.env already exists there with the real secrets (never
# committed — see .env.example for the shape).
set -euo pipefail
cd "$(dirname "$0")/.."

# --no-cache: this host's BuildKit has repeatedly reported COPY/RUN layers as
# cache hits after real source changes (root cause of at least one stale
# production deploy already). Rebuilding from scratch costs ~1 extra minute
# but guarantees the image matches what's on disk.
docker build --no-cache -t karaoke-api:latest -f apps/api/Dockerfile .
docker build --no-cache -t karaoke-landing:latest apps/landing
docker build --no-cache -t karaoke-venue-panel:latest -f apps/venue-panel/Dockerfile .

cd infra
set -a
source .env
set +a
docker stack deploy -c stack.yml karaoke
