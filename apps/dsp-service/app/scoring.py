"""3.4 Scoring Output — pitch matching + streak persistence -> 0-100 score."""

import math

SIMILARITY_TOLERANCE_SEMITONES = 2.0  # semitone diff at which similarity reaches 0
STREAK_MATCH_THRESHOLD = 0.6  # similarity above which a frame counts toward a streak
STREAK_BONUS_PER_FRAME = 0.5
STREAK_BONUS_CAP = 15.0


def semitone_diff_folded(live_hz: float, ref_hz: float) -> float:
    """Pitch difference in semitones, folded into [0, 6] so octave errors
    (a common false pitch-detect) don't register as maximally wrong."""
    diff = abs(12 * math.log2(live_hz / ref_hz)) % 12
    return 12 - diff if diff > 6 else diff


def pitch_similarity(live_hz: float, ref_hz: float, tolerance: float = SIMILARITY_TOLERANCE_SEMITONES) -> float:
    """Continuous 0-1 match score instead of a binary in/out-of-tune cutoff,
    so a near-miss earns partial credit rather than nothing."""
    diff = semitone_diff_folded(live_hz, ref_hz)
    return max(0.0, 1 - diff / tolerance)


class ScoringSession:
    """Tracks running pitch-match accuracy and streak bonus for one performance."""

    def __init__(self) -> None:
        self.total_frames = 0
        self.similarity_sum = 0.0
        self.current_streak = 0
        self.streak_bonus = 0.0

    def add_frame(self, live_f0: float | None, ref_f0: float | None) -> float:
        if live_f0 is None or ref_f0 is None or ref_f0 <= 0:
            self.current_streak = 0
            return self.current_score()

        self.total_frames += 1
        similarity = pitch_similarity(live_f0, ref_f0)
        self.similarity_sum += similarity

        if similarity >= STREAK_MATCH_THRESHOLD:
            self.current_streak += 1
            self.streak_bonus = min(STREAK_BONUS_CAP, self.streak_bonus + STREAK_BONUS_PER_FRAME)
        else:
            self.current_streak = 0
            self.streak_bonus = max(0.0, self.streak_bonus - STREAK_BONUS_PER_FRAME)

        return self.current_score()

    def pitch_accuracy(self) -> float:
        if self.total_frames == 0:
            return 0.0
        return self.similarity_sum / self.total_frames

    def current_score(self) -> float:
        base = self.pitch_accuracy() * 100 * 0.85
        return round(min(100.0, base + self.streak_bonus), 1)
