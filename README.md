# Karabol — Next-Gen Karaoke & Loyalty Platform

Hybrid interactive karaoke platform for nightlife venues: YouTube-sourced tracks, a
density-based queue algorithm, live crowd voting on every performance, and POS-integrated
tiered rewards. Self-hosted VPS architecture (Postgres + Redis, not edge KV) for strong
consistency on fast-mutating state (queue, live scores, leaderboards).

## Repo layout

```
apps/
  api/            Node.js + Express + Socket.io — REST API, auth/RBAC, WebSocket gateway
  dsp-service/    PARKED — see its README; scoring is peer voting inside api now
  venue-panel/    React + Vite — admin/staff live queue dashboard
  mobile/         React Native (Expo) — patron app: table join, song search, wallet
packages/
  shared/         Types shared across services: roles, queue algorithm, socket events
infra/
  docker-compose.yml   Postgres, Redis, api, nginx
  nginx/               Reverse proxy + WebSocket upgrade config
```

## Local development

```bash
cp .env.example .env        # fill in secrets
npm install                 # installs all workspaces
npm run infra:up            # postgres + redis (add api once its Dockerfile is ready for your env)
npm run --workspace=apps/api prisma:migrate
npm run dev:api              # http://localhost:4000
npm run dev:venue-panel       # http://localhost:5173
```

Set `YOUTUBE_API_KEY` (Data API v3) and optionally `YOUTUBE_REGION_CODE` (default `BO`)
in `.env` — search and the enqueue-time playability check both need it.

## Status

Auth + RBAC, table association, density-based queue engine (3.3), **peer voting** (3.4):
patrons rate each performance 1–5 from their phones, the tally is live on the performer's
screen / venue dashboard / TV board, and freezes into a `Score` 90 s after the song ends
(reward issued only with ≥3 voters). Tiered POS reward issuance (3.5) wired to a real
Loyverse REST client, QR code rendering (patron wallet + a staff redeem/verify page in
the venue panel), YouTube search restricted to embeddable + region-playable videos with
an enqueue-time re-check (3.1), and a full patron mobile flow — auth, table join,
search & queue, perform, vote, wallet.

DSP vocal scoring was tried and parked: a karaoke track carries no lead vocal, so there is
no reference melody to score against — details in `apps/dsp-service/README.md`.

Known gaps / TODOs:
- Patron auth is email+password as a stand-in for Phone+OTP / OAuth (2) — needs an
  SMS/OAuth provider decision.
- `LoyverseClient.ensureDiscount`'s discount-creation payload is best-effort: Loyverse's
  full API reference is gated behind a logged-in developer account, so verify field names
  against a real venue token before relying on it (see comments in `loyverseClient.ts`).
- Votes are gated on being logged in and not the performer, but not yet on physically
  being at the venue (table join doesn't persist an `Attendance` row) — a friend at home
  could vote. Fine for a pilot; tie voting to a live table session before it matters.
- QR/table association still uses a PIN form; swap in a QR scanner (`expo-camera`) once
  testing against printed venue QR codes.
