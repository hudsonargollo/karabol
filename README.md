# Karaoke Bolivia — Next-Gen Karaoke & Loyalty Platform

Hybrid interactive karaoke platform for nightlife venues: YouTube-sourced tracks, a
density-based queue algorithm, real-time DSP vocal scoring, and POS-integrated tiered
rewards. Self-hosted VPS architecture (Postgres + Redis, not edge KV) for strong
consistency on fast-mutating state (queue, live scores, leaderboards).

## Repo layout

```
apps/
  api/            Node.js + Express + Socket.io — REST API, auth/RBAC, WebSocket gateway
  dsp-service/    Python/FastAPI — bandpass filtering + YIN pitch scoring, streams to Redis
  venue-panel/    React + Vite — admin/staff live queue dashboard
  mobile/         React Native (Expo) — patron app: table join, song search, wallet
packages/
  shared/         Types shared across services: roles, queue algorithm, socket events
infra/
  docker-compose.yml   Postgres, Redis, api, dsp-service, nginx
  nginx/               Reverse proxy + WebSocket upgrade config
```

## Local development

```bash
cp .env.example .env        # fill in secrets
npm install                 # installs all workspaces
npm run infra:up            # postgres + redis (add api/dsp-service once Dockerfiles are ready for your env)
npm run --workspace=apps/api prisma:migrate
npm run dev:api              # http://localhost:4000
npm run dev:venue-panel       # http://localhost:5173

# DSP service (separate venv)
cd apps/dsp-service && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Status

Foundational scaffold: auth + RBAC, table association, density-based queue engine (3.3),
YIN-based DSP scoring pipeline (3.4), tiered POS reward issuance (3.5), and shells for the
venue panel and mobile app. Not yet wired: YouTube Data API search, real POS provider
calls (Loyverse), QR code image rendering, and the mobile audio-capture client for the
DSP WebSocket. See inline `TODO`s.
