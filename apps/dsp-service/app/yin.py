"""3.4 Pitch Oracle — YIN pitch detection (de Cheveigne & Kawahara, 2002)."""

import numpy as np

DEFAULT_FMIN = 60.0  # Hz, below the lowest common singing voice
DEFAULT_FMAX = 1200.0  # Hz, above the highest common singing voice
DEFAULT_THRESHOLD = 0.15


def _difference_function(frame: np.ndarray, max_lag: int) -> np.ndarray:
    diff = np.zeros(max_lag)
    for lag in range(1, max_lag):
        shifted = frame[: len(frame) - lag]
        delayed = frame[lag:]
        diff[lag] = np.sum((shifted - delayed) ** 2)
    return diff


def _cumulative_mean_normalized_difference(diff: np.ndarray) -> np.ndarray:
    cmnd = np.ones_like(diff)
    running_sum = 0.0
    for lag in range(1, len(diff)):
        running_sum += diff[lag]
        cmnd[lag] = diff[lag] * lag / running_sum if running_sum > 0 else 1.0
    return cmnd


def _absolute_threshold(cmnd: np.ndarray, threshold: float) -> int | None:
    for lag in range(2, len(cmnd) - 1):
        if cmnd[lag] < threshold:
            # Refine to the local minimum, then parabolic-interpolate.
            while lag + 1 < len(cmnd) and cmnd[lag + 1] < cmnd[lag]:
                lag += 1
            return lag
    return None


def yin_pitch(
    frame: np.ndarray,
    sample_rate: int,
    fmin: float = DEFAULT_FMIN,
    fmax: float = DEFAULT_FMAX,
    threshold: float = DEFAULT_THRESHOLD,
) -> float | None:
    """Returns the fundamental frequency (Hz) of `frame`, or None if unvoiced."""
    min_lag = int(sample_rate / fmax)
    max_lag = int(sample_rate / fmin)
    max_lag = min(max_lag, len(frame) // 2)
    if max_lag <= min_lag:
        return None

    diff = _difference_function(frame, max_lag)
    cmnd = _cumulative_mean_normalized_difference(diff)
    cmnd[:min_lag] = 1.0  # ignore lags above fmax

    lag = _absolute_threshold(cmnd, threshold)
    if lag is None:
        return None

    return sample_rate / lag
