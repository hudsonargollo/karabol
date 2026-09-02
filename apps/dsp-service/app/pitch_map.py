"""3.4 builds the temporary reference pitch map for a track's audio.

Audio extraction from the YouTube track itself (e.g. via yt-dlp against the
video the patron queued) is a separate pipeline step — this module only
turns raw PCM samples into a time-indexed f0 map once that audio is in hand.
"""

import numpy as np

from .bandpass import bandpass_filter
from .yin import yin_pitch

FRAME_SIZE = 2048
HOP_SIZE = 1024


def build_pitch_map(samples: np.ndarray, sample_rate: int) -> list[dict]:
    filtered = bandpass_filter(samples, sample_rate)
    pitch_map: list[dict] = []

    for start in range(0, len(filtered) - FRAME_SIZE, HOP_SIZE):
        frame = filtered[start : start + FRAME_SIZE]
        f0 = yin_pitch(frame, sample_rate)
        pitch_map.append({"t": start / sample_rate, "f0": f0})

    return pitch_map
