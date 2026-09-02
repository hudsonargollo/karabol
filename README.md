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

Auth + RBAC, table association, density-based queue engine (3.3), YIN-based DSP scoring
pipeline (3.4) with continuous pitch-similarity scoring, tiered POS reward issuance (3.5)
wired to a real Loyverse REST client, QR code rendering (patron wallet + a staff
redeem/verify page in the venue panel), sanitized YouTube search (3.1), and a full patron
mobile flow — auth, table join, search & queue, live DSP scoring via mic capture streamed
to the DSP service's WebSocket, and the reward wallet.

Known gaps / TODOs:
- Patron auth is email+password as a stand-in for Phone+OTP / OAuth (2) — needs an
  SMS/OAuth provider decision.
- `LoyverseClient.ensureDiscount`'s discount-creation payload is best-effort: Loyverse's
  full API reference is gated behind a logged-in developer account, so verify field names
  against a real venue token before relying on it (see comments in `loyverseClient.ts`).
- `react-native-live-audio-stream` ships native code — the mobile audio pipeline needs a
  custom dev client / bare build, not Expo Go, and hasn't been run on a real device yet.
- QR/table association still uses a PIN form; swap in a QR scanner (`expo-camera`) once
  testing against printed venue QR codes.
