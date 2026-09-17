"""
In-memory sliding window rate limiter for FastAPI routes.
"""

import time
from collections import defaultdict, deque
from typing import Dict
from fastapi import HTTPException, Request, status

from app.config import get_settings


class SlidingWindowRateLimiter:
    """Tracks timestamps of incoming requests per client IP to enforce rate limits."""

    def __init__(self, requests_per_minute: int = 20):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60.0
        self._records: Dict[str, deque] = defaultdict(deque)

    def check(self, client_ip: str) -> None:
        """
        Record a request from client_ip and raise 429 if the limit is exceeded.

        Args:
            client_ip: Remote client IP address.

        Raises:
            HTTPException: 429 Too Many Requests if rate limit is reached.
        """
        now = time.time()
        record = self._records[client_ip]

        # Evict timestamps older than the sliding window
        while record and (now - record[0]) > self.window_seconds:
            record.popleft()

        if len(record) >= self.requests_per_minute:
            retry_after = int(self.window_seconds - (now - record[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded ({self.requests_per_minute} requests/minute). Please retry in {retry_after} seconds.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        record.append(now)


# Global limiter instance
_rate_limiter = None


def get_rate_limiter() -> SlidingWindowRateLimiter:
    """Get or create singleton rate limiter."""
    global _rate_limiter
    if _rate_limiter is None:
        settings = get_settings()
        _rate_limiter = SlidingWindowRateLimiter(requests_per_minute=settings.rate_limit_per_minute)
    return _rate_limiter


def rate_limit_dependency(request: Request) -> None:
    """FastAPI dependency for checking client IP rate limit."""
    client_ip = "unknown"
    if request.client and request.client.host:
        client_ip = request.client.host

    # Check forward headers if behind proxy
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    limiter = get_rate_limiter()
    limiter.check(client_ip)
