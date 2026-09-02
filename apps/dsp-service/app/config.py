import os

from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:4000")
INTERNAL_SERVICE_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "dev-internal-secret-change-me")
SAMPLE_RATE = int(os.getenv("DSP_SAMPLE_RATE", "44100"))
