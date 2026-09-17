"""
Health check and readiness endpoint.
"""

from fastapi import APIRouter, Depends
from app.config import Settings, get_settings


router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", summary="Service health status")
async def health_check(settings: Settings = Depends(get_settings)) -> dict:
    """Return system readiness and whether Gemini API key is configured."""
    has_gemini = bool(settings.gemini_api_key and settings.gemini_api_key.strip() != "your_gemini_api_key_here")
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "gemini_configured": has_gemini,
        "max_upload_size_mb": settings.max_file_size_mb,
    }
