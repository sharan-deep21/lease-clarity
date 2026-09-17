"""
Endpoint for two-document lease comparison.
"""

from fastapi import APIRouter, Depends, status

from app.schemas.comparison import ComparisonRequest, ComparisonResponse
from app.services.comparator import compare_lease_versions
from app.utils.rate_limiter import rate_limit_dependency


router = APIRouter(prefix="/api/comparison", tags=["Comparison"])


@router.post(
    "/compare",
    response_model=ComparisonResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_dependency)],
    summary="Compare two lease versions side-by-side and evaluate tenant impact",
)
async def compare_leases(payload: ComparisonRequest) -> ComparisonResponse:
    """Evaluates substantive clause differences between original and revised leases."""
    return await compare_lease_versions(
        original_text=payload.original_text,
        revised_text=payload.revised_text,
        original_filename=payload.original_filename,
        revised_filename=payload.revised_filename,
    )
