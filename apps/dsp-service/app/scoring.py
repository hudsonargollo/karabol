"""3.4 Scoring Output — pitch matching + streak persistence -> 0-100 score."""

import math

SEMITONE_TOLERANCE = 1.0  # how close (in semitones) counts as a "match"
STREAK_BONUS_PER_FRAME = 0.5
STREAK_BONUS_CAP = 15.0


def hz_to_semitone_diff(live_hz: float, ref_hz: float) -> float:
    return abs(12 * math.log2(live_hz / ref_hz))


class ScoringSession:
    """Tracks running pitch-match accuracy and streak bonus for one performance."""

    def __init__(self) -> None:
        self.total_frames = 0
        self.matched_frames = 0
        self.current_streak = 0
        self.streak_bonus = 0.0

    def add_frame(self, live_f0: float | None, ref_f0: float | None) -> float:
        if live_f0 is None or ref_f0 is None or ref_f0 <= 0:
            self.current_streak = 0
            return self.current_score()

        self.total_frames += 1
        diff = hz_to_semitone_diff(live_f0, ref_f0)
        is_match = diff <= SEMITONE_TOLERANCE

        if is_match:
            self.matched_frames += 1
            self.current_streak += 1
            self.streak_bonus = min(STREAK_BONUS_CAP, self.streak_bonus + STREAK_BONUS_PER_FRAME)
        else:
            self.current_streak = 0
            self.streak_bonus = max(0.0, self.streak_bonus - STREAK_BONUS_PER_FRAME)

        return self.current_score()

    def pitch_accuracy(self) -> float:
        if self.total_frames == 0:
            return 0.0
        return self.matched_frames / self.total_frames

    def current_score(self) -> float:
        base = self.pitch_accuracy() * 100 * 0.85
        return round(min(100.0, base + self.streak_bonus), 1)
