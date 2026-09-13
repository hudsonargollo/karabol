# dsp-service — PARKED

**Not deployed. Not wired to anything.** Scoring moved to peer voting in
`apps/api/src/services/votingEngine.ts` (design notes in
`packages/shared/src/voting.ts`).

## Why it was parked

This service scored a singer by comparing their live pitch (YIN) against a
reference pitch map built from the queued track's audio. That design cannot
work for karaoke, independent of how well the DSP is implemented:

- A karaoke track has **no lead vocal** — that's the singer's job. So the
  "reference" extracted from it is the backing instrumental.
- YIN is a monophonic estimator. On a polyphonic backing mix it returns the
  common fundamental, i.e. the **bass/chord root**, not the melody. Measured
  against this very pipeline: a C-major backing yields `ref_f0 = 65 Hz` (C2),
  and a singer hitting E4/G4/A4 — all correct notes — scores **0.00**
  similarity. Only C4 passed, by octave-folding coincidence.
- Building the map cost ~81 s of CPU per 4-minute song (pure-Python YIN), and
  required pulling audio from YouTube, which the ToS do not allow.

Commercial karaoke scoring uses **licensed melody data** (MIDI/note files
shipped with the track), never pitch extracted from the mixed audio. If real
melody scoring is ever wanted, that's the path — and this code's YIN +
scoring session would be reusable on the *live* side against such a
reference.

## What's still useful in here

- `yin.py` — correct YIN implementation (verified: 220 Hz tone → 220.5 Hz).
  Would need vectorizing for production throughput.
- `scoring.py` — octave-folded similarity + streak bonus; sound design for
  scoring a monophonic voice against a *real* melody line.
- `bandpass.py` — note: a 4th-order Butterworth at 200 Hz does not remove a
  65 Hz bass line; if revived, use a steeper filter or a real vocal separator.
