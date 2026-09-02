import json
from typing import Any

import numpy as np
import redis.asyncio as redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from .api_client import post_final_score, post_live_score
from .bandpass import bandpass_filter
from .config import REDIS_URL, SAMPLE_RATE
from .pitch_map import build_pitch_map
from .scoring import ScoringSession
from .yin import yin_pitch

app = FastAPI(title="Karaoke DSP Service")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

LIVE_SCORE_PUBLISH_EVERY_N_FRAMES = 15


class PitchMapRequest(BaseModel):
    queueEntryId: str
    samples: list[float]
    sampleRate: int = SAMPLE_RATE


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/pitch-map")
async def create_pitch_map(req: PitchMapRequest) -> dict[str, Any]:
    """Analyzes the queued YouTube track's audio into a reference f0 map (3.4)."""
    samples = np.array(req.samples, dtype=np.float64)
    pitch_map = build_pitch_map(samples, req.sampleRate)

    await redis_client.set(f"pitchmap:{req.queueEntryId}", json.dumps(pitch_map), ex=60 * 60 * 6)
    return {"queueEntryId": req.queueEntryId, "frames": len(pitch_map)}


def _nearest_ref_f0(pitch_map: list[dict], t: float) -> float | None:
    if not pitch_map:
        return None
    closest = min(pitch_map, key=lambda frame: abs(frame["t"] - t))
    return closest["f0"]


@app.websocket("/ws/score/{queue_entry_id}")
async def score_stream(websocket: WebSocket, queue_entry_id: str, venue_id: str):
    """
    Streams live mic audio chunks from the venue panel/mobile client.
    Each message: {"t": <seconds into track>, "samples": [float, ...]}
    A final {"type": "end"} message triggers persistence of the final score.
    """
    await websocket.accept()

    raw_pitch_map = await redis_client.get(f"pitchmap:{queue_entry_id}")
    pitch_map = json.loads(raw_pitch_map) if raw_pitch_map else []
    session = ScoringSession()
    frame_count = 0

    try:
        while True:
            message = await websocket.receive_json()

            if message.get("type") == "end":
                await post_final_score(queue_entry_id, session.current_score(), session.pitch_accuracy())
                await websocket.send_json({"type": "final", "value": session.current_score()})
                break

            samples = np.array(message["samples"], dtype=np.float64)
            filtered = bandpass_filter(samples, SAMPLE_RATE)
            live_f0 = yin_pitch(filtered, SAMPLE_RATE)
            ref_f0 = _nearest_ref_f0(pitch_map, message["t"])

            score = session.add_frame(live_f0, ref_f0)
            frame_count += 1

            await websocket.send_json({"type": "tick", "value": score})
            if frame_count % LIVE_SCORE_PUBLISH_EVERY_N_FRAMES == 0:
                await post_live_score(queue_entry_id, venue_id, score)

    except WebSocketDisconnect:
        if session.total_frames > 0:
            await post_final_score(queue_entry_id, session.current_score(), session.pitch_accuracy())
