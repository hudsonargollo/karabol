## Product Requirements Document: Karabol

### Problem Statement & Scope
Bolivian nightlife venues lack a streamlined, engaging karaoke experience. Patrons face opaque wait times and unfair sequencing, while venues miss opportunities to drive revenue through gamification. Karabol v2 solves this by integrating a fair-play queue, real-time vocal scoring, and POS-linked loyalty rewards into a scalable, self-hosted SaaS platform.

### Technical Specifications & Modules
*   **Codebase Foundation:** Extend the existing `hudsonargollo/karabol` monorepo, maintaining the Prisma PostgreSQL schema and Redis configuration for low-latency state management[cite: 1].
*   **Media Streaming:** Utilize the existing YouTube integration (`routes/youtube.ts`) to fetch and stream karaoke videos dynamically[cite: 1]. Implement a VPS-based local video database as an automatic fallback for tracks with embedded playback restrictions.
*   **Audio DSP Pipeline:** The Python `apps/dsp-service` must process live microphone audio concurrently with video playback[cite: 1]. When a patron sings a dynamic track by Deftones or Underoath, the optimized YIN pitch mapping (`yin.py`) and bandpass filters (`bandpass.py`) will evaluate pitch accuracy while isolating vocals and rejecting venue noise[cite: 1].
*   **Smart Queue Engine:** The `queueEngine.ts` will strictly enforce table-weighted round-robin sequencing, anti-monopoly song delays, and live wait-time estimations to ensure fairness[cite: 1].
*   **Loyalty & POS Integration:** Automate loyalty point distribution based on vocal accuracy and table spend using `rewardEngine.ts` and `loyverseClient.ts`[cite: 1].
*   **Regional Gamification:** Implement the existing Bolivian mascot assets (Alpacho, Cambita, Diablada, Jucumari, Taitetu, Capybara, Laperechola) as unlockable avatars and performance tier indicators[cite: 1].
*   **Staff Dashboard:** Deploy a high-contrast console for stage hosts to manage the queue, trigger crowd reactions, and validate QR-code reward redemptions via WebSocket synchronization[cite: 1].

### Metrics & Risk Mitigation
*   **Leading Metric:** Average number of songs queued per active table session.
*   **Lagging Metric:** Percentage of earned loyalty points successfully redeemed at the venue POS.
*   **Primary Risk:** High DSP latency during peak hours leading to out-of-sync vocal scoring.
*   **Mitigation:** Containerize the DSP service separately and stress-test the WebSocket event bus to guarantee real-time bidirectional communication.
