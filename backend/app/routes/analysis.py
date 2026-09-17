"""
Endpoints for plain-language lease summaries, risk evaluations, and attorney checklists.
"""

from fastapi import APIRouter, Depends, status

from app.config import Settings, get_settings
from app.schemas.analysis import FullAnalysisResponse, LeaseSummary, RiskAnalysisResponse
from app.schemas.comparison import LawyerChecklistResponse
from app.schemas.document import TextInputRequest
from app.services.lawyer_checklist import generate_lawyer_checklist
from app.services.risk_detector import detect_lease_risks
from app.services.summarizer import generate_lease_summary
from app.utils.rate_limiter import rate_limit_dependency


router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.post(
    "/summary",
    response_model=LeaseSummary,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_dependency)],
    summary="Generate plain-language lease summary organized into 6 domains",
)
async def summarize_lease(payload: TextInputRequest) -> LeaseSummary:
    """Generate plain-language summary across Rent, Deposit, Term, Termination, Maintenance, and Other."""
    return await generate_lease_summary(payload.text)


@router.post(
    "/risks",
    response_model=RiskAnalysisResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_dependency)],
    summary="Audit lease for tenant-unfavorable red flags and verbatim quotes",
)
async def evaluate_risks(payload: TextInputRequest) -> RiskAnalysisResponse:
    """Audit lease for unfair, one-sided, or predatory terms with exact quotes."""
    return await detect_lease_risks(payload.text, filename=payload.filename)


@router.post(
    "/full",
    response_model=FullAnalysisResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_dependency)],
    summary="Generate both plain-language summary and risk evaluation in one operation",
)
async def full_analysis(
    payload: TextInputRequest,
    settings: Settings = Depends(get_settings),
) -> FullAnalysisResponse:
    """Unified endpoint returning complete lease breakdown and red-flag audit."""
    summary = await generate_lease_summary(payload.text)
    risk_report = await detect_lease_risks(payload.text, filename=payload.filename)

    return FullAnalysisResponse(
        filename=payload.filename,
        summary=summary,
        risk_analysis=risk_report,
        disclaimer=settings.mandatory_legal_disclaimer,
    )


@router.post(
    "/lawyer-checklist",
    response_model=LawyerChecklistResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_dependency)],
    summary="Generate prioritized questions to ask a tenant attorney",
)
async def create_lawyer_checklist(payload: TextInputRequest) -> LawyerChecklistResponse:
    """Synthesizes detected lease risks into concrete questions for a lawyer."""
    # First detect risks so the checklist can address them specifically
    risk_report = await detect_lease_risks(payload.text, filename=payload.filename)
    return await generate_lawyer_checklist(
        document_text=payload.text,
        red_flags=risk_report.red_flags,
        filename=payload.filename,
    )
