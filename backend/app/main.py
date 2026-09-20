"""
FastAPI application factory and middleware configuration.
"""

import logging
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routes.health import router as health_router
from app.routes.document import router as document_router
from app.routes.analysis import router as analysis_router
from app.routes.qa import router as qa_router
from app.routes.comparison import router as comparison_router


# Configure root logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("rental_agreement_assistant")


def create_app() -> FastAPI:
    """Application factory for FastAPI server."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Rental Agreement Assistant for First-Time Tenants — GenAI legal assistance with plain summaries, red-flag detection, and grounded Q&A.",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global friendly exception handling (prevent exposing internal stack traces)
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "status_code": exc.status_code},
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception during {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected error occurred while processing your document. Please verify the document format or try again.",
                "status_code": 500,
            },
        )

    # Register routers
    app.include_router(health_router)
    app.include_router(document_router)
    app.include_router(analysis_router)
    app.include_router(qa_router)
    app.include_router(comparison_router)

    # Mount static frontend build if available
    import os
    from fastapi.staticfiles import StaticFiles

    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    frontend_dist = os.path.join(root_dir, "frontend", "dist")

    if os.path.exists(frontend_dist):
        app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

    return app


app = create_app()
