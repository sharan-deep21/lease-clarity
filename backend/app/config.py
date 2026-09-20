"""
Application Configuration and Environment Settings.
"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables."""

    # Application details
    app_name: str = "Rental Agreement Assistant"
    app_version: str = "1.0.0"
    debug: bool = False

    # Server settings
    host: str = "127.0.0.1"
    port: int = 8000

    # Security & limits
    max_file_size_mb: int = Field(default=5, description="Maximum allowed file size in MB")
    max_file_size_bytes: int = 5 * 1024 * 1024  # 5MB strict server-side boundary
    rate_limit_per_minute: int = Field(default=20, description="Max requests per minute per client IP")

    # Gemini LLM settings
    gemini_api_key: str = Field(default="", description="Gemini API Key from Google AI Studio")
    gemini_model: str = Field(default="gemini-3.1-flash-lite", description="Gemini model identifier")

    # CORS settings
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Mandatory legal disclaimer appended to every AI output
    mandatory_legal_disclaimer: str = (
        "This is informational only and not a substitute for professional legal advice."
    )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Return CORS allowed origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return cached instance of application settings."""
    return Settings()
