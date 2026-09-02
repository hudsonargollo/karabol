import httpx

from .config import API_BASE_URL, INTERNAL_SERVICE_SECRET

_headers = {"x-internal-secret": INTERNAL_SERVICE_SECRET}


async def post_live_score(queue_entry_id: str, venue_id: str, value: float) -> None:
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=2.0) as client:
        await client.post(
            "/scores/live",
            json={"queueEntryId": queue_entry_id, "venueId": venue_id, "value": value},
            headers=_headers,
        )


async def post_final_score(queue_entry_id: str, value: float, pitch_accuracy: float) -> None:
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=5.0) as client:
        await client.post(
            "/scores/final",
            json={"queueEntryId": queue_entry_id, "value": value, "pitchAccuracy": pitch_accuracy},
            headers=_headers,
        )
