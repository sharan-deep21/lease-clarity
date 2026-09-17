"""
Endpoint for grounded Q&A with mandatory section/paragraph citations.
"""

from fastapi import APIRouter, Depends, status

from app.schemas.qa import GroundedAnswerResponse, QuestionRequest
from app.services.qa_engine import answer_lease_question
from app.utils.rate_limiter import rate_limit_dependency


router = APIRouter(prefix="/api/qa", tags=["Q&A"])


@router.post(
    "/ask",
    response_model=GroundedAnswerResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_dependency)],
    summary="Ask a question about the lease agreement with mandatory citations",
)
async def ask_question(payload: QuestionRequest) -> GroundedAnswerResponse:
    """
    Answers user questions strictly grounded in the lease text.
    Must cite section/paragraph or refuse with:
    'This document doesn't address that — consider asking a lawyer'
    """
    return await answer_lease_question(
        document_text=payload.document_text,
        question=payload.question,
    )
