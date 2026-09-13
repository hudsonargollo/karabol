# Karabol — Product Requirements & Build Prompt

> **Name: Karabol** (decided). The shared package is still `@karaokebo/shared`; renaming it
> touches every import across the monorepo — do it in its own commit.

## 1. Problem & scope

Bolivian nightlife venues lack a streamlined karaoke experience. Patrons face opaque wait
times and unfair sequencing; venues miss revenue they could drive through gamification.
Karabol is a self-hosted SaaS platform combining a fair-play queue, live crowd voting on
every performance, and POS-linked loyalty rewards.

Non-goals for this cycle: multi-venue franchising, patron-to-patron social features,
native iOS/Android store releases.

## 2. Ground truth — read before planning any work

The repo is ~5,300 lines across `apps/{api,dsp-service,venue-panel,mobile,landing}` and
`packages/shared`. Do **not** assume a feature works because a file exists for it. Verified
state as of this revision:

### Working

- **Auth + RBAC**, table association (PIN-based), venue/table CRUD — `apps/api/src/routes/`
- **Density-based queue rotation** — `queueEngine.ts`, Redis-backed round-robin with a
  per-table consecutive-song block
- **YouTube search**, sanitized to Music category + strict safe search —
  `routes/youtube.ts`
- **QR reward rendering + staff redeem page** — `utils/qrcode.ts`, venue panel
- **WebSocket transport** wired across api / venue-panel / mobile
- **Peer voting** — `votingEngine.ts` + `routes/performances.ts`. Patrons vote 1–5 while a
  song plays and for 90 s after; tally is live over `VOTE_UPDATE`; `finalizeVotes` freezes
  it into a `Score` (0–100, mapped from the 1–5 mean so venue reward thresholds still
  apply) and issues the reward only with ≥3 voters. Timer-based close plus a persisted
  `votingClosesAt` and a startup sweep, so restarts don't strand ballots
- **Reward tier + discount issuance logic** — `rewardEngine.ts`, fed by the vote tally
- **Playability gate** — `youtubeClient.ts`: search restricted to embeddable + syndicated
  music videos, every result and every enqueue re-verified via `videos.list`
  (embeddable / public / not region-blocked for `YOUTUBE_REGION_CODE`, default `BO`);
  verdicts cached 24 h, searches 6 h. The TV board additionally listens for IFrame
  player `onError` and shows a staff-facing overlay for the rare video that changed
  status after enqueue

### Decided — do not reopen without new information

- **DSP vocal scoring is parked** (`apps/dsp-service/README.md`). A karaoke track has no
  lead vocal, so pitch-extracting it yields the bass/chord root, not the melody; measured
  against the real pipeline, a singer hitting correct in-key notes scored 0.00. Real
  melody scoring needs licensed melody data shipped with the track — a catalog decision,
  not a DSP one. Crowd voting is the scoring model until that exists.
- **No headless-browser or third-party-downloader audio extraction.** Tested: a
  Playwright-driven Chromium gets the same embed restrictions a normal browser does, and
  every scraping route sits on the wrong side of YouTube's terms. With voting, the
  platform no longer needs track audio at all.

### Not implemented (despite being describable as "existing")

- **Anti-monopoly song delays** — no cooldown on repeated songs or artists anywhere
- **Wait-time estimation** — `BoardPage.tsx:174` renders the literal string `SIGUIENTE` on
  row 0 and an empty string on every other row. There is no ETA calculation
- **Table weighting** — rotation is flat. `resolveConsecutiveLimit()` returns 2 when more
  than one table is active, 3 otherwise. No weighting by spend, party size, or anything else
- **Local video fallback** — restricted videos are now filtered *out* before they reach
  the queue rather than played from a local copy; there is no rehosted catalog
- **Mascot unlocks / tiers** — assets and screens exist (`mobile/src/lib/crew.ts`), but
  there is no unlock logic
- **Crowd reactions** — no implementation

## 3. Constraints

- Extend the existing monorepo. Keep the Prisma/Postgres schema and Redis as the
  fast-mutation backbone; Postgres holds durable `QueueEntry` / `Score` rows.
- Do not rewrite the socket event contract in `packages/shared` — mobile and venue-panel
  both depend on it.
- Do not change `QueueEngine`'s Redis key layout without a migration path; live venue
  state would be orphaned.
- `apps/dsp-service` is parked, not deleted — leave it out of every deploy target and don't
  wire anything to it.

## 4. Work items, in priority order

### P0 — Voting on real phones in a real room

The voting loop is built but has only been exercised through types. Run a night with
≥3 tables: vote from phones, watch the board meter move, confirm the performer's wallet
gets a QR when the tally clears bronze with ≥3 voters, and that a restart mid-grace still
finalizes the ballot.

*Acceptance:* a performance rated ≥3.4★ by ≥3 voters yields a `Score` + scannable
`RewardRedemption`; a performance with 2 voters yields a `Score` but no reward; a skipped
song yields neither; killing the API during the 90 s grace and restarting finalizes it.

### P0 — YouTube API quota

Each `search.list` call costs 100 units against a default 10,000 unit/day quota — roughly
**100 searches per day**, which one busy venue exhausts within the first hour. Add caching
of popular queries, a local song catalog for repeat requests, and quota-aware degradation.

*Acceptance:* a venue running a simulated 200-song night stays within quota; when quota is
exhausted, patrons get a usable cached/local catalog rather than a 502.

### P1 — Playback failure recovery on the board

Restricted videos are filtered out before enqueue, but a video can change status between
enqueue and play. Today the TV board shows a staff-facing overlay and waits for a manual
skip. Give the board a way to report the failure so the queue auto-advances — without
turning the unauthenticated board endpoint into a public "skip anyone" button (a per-board
token issued by staff, or a signed venue-panel session).

*Acceptance:* a video that returns IFrame error 101/150/100 at play time is skipped and the
next table starts within 10 s with no staff action; an anonymous POST cannot skip.

### P1 — Queue fairness: anti-monopoly + ETA

Add a cooldown preventing the same song (and optionally artist) from being re-queued within
a configurable window, and compute a live wait-time estimate per queue entry from rotation
position, block limits, and observed average song duration.

*Acceptance:* the same song cannot be queued twice within the cooldown window across
different tables; every row on the venue board shows an ETA whose error is within ±90s of
actual at a 10-song depth.

### P2 — Loyverse verification

`loyverseClient.ts`'s own docstring flags `ensureDiscount`'s payload as best-effort because
Loyverse's API reference sits behind a developer login. Verify field names against a real
venue token.

*Acceptance:* a discount created through `ensureDiscount` appears correctly in a real
Loyverse account and applies at the POS.

### P2 — Vote integrity

Today a vote needs a login and not being the performer — nothing proves the voter is in
the room. Tie eligibility to a live table session (persist an `Attendance` on table join,
expire it), and consider one-vote-per-table for BATTLE mode.

*Acceptance:* a logged-in user who has not joined a table at this venue tonight gets 403
on vote; a user whose table session expired gets 403.

### P3 — Gamification

Mascot avatars (Alpacho, Cambita, Diablada, Jucumari, Taitetu, Capybara, Laperechola) as
unlockable rewards tied to performance tiers, plus staff-triggered crowd reactions on the
venue board.

*Acceptance:* crossing a tier threshold unlocks the corresponding mascot and the unlock is
visible in the patron profile without an app restart.

## 5. Metrics

- **Leading — engagement:** average songs queued per active table session.
- **Leading — fairness:** p90 wait time between a table's consecutive turns, and the
  variance of that wait across tables in a session. *(The product's core claim is fairness;
  songs-queued alone rises even when one table monopolizes the mic, so it cannot detect the
  failure mode this platform exists to prevent.)*
- **Lagging:** percentage of earned loyalty points successfully redeemed at the venue POS.
- **Health:** percentage of completed performances that reach ≥3 voters. If this is low the
  ballot isn't discoverable and every reward metric is starved upstream.

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Vote brigading** — a table of friends five-stars each other into GOLD discounts | Reward cost with no engagement value | ≥3 voters floor is in; add venue-presence gating (P2) and watch the per-table vote pattern in the leaderboard query |
| **Ballot not discoverable** — patrons never open the vote screen | Empty tallies, no rewards, dead loop | The queue screen shows ★ VOTAR on the now-playing card and the TV board says "vota desde tu celular"; measure the health metric above from night one |
| **API quota exhaustion** mid-service | Search dies during peak hours | Caching + local catalog (P0 above); request a quota increase |
| **POS integration unverified** | Rewards don't apply at the till | Test against a real Loyverse account before a venue pilot. `rewardEngine.ts` already degrades safely — the QR issues regardless and staff apply discounts manually |
