"""3.4 Bandpass Filtering — isolate the human voice band from venue noise."""

import numpy as np
from scipy.signal import butter, sosfiltfilt

VOICE_BAND_HZ = (200.0, 3500.0)


def bandpass_filter(samples: np.ndarray, sample_rate: int, band: tuple[float, float] = VOICE_BAND_HZ) -> np.ndarray:
    low, high = band
    nyquist = sample_rate / 2
    sos = butter(4, [low / nyquist, high / nyquist], btype="bandpass", output="sos")
    return sosfiltfilt(sos, samples)
