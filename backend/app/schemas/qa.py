"""
Pydantic models for grounded legal Q&A.
"""

from typing import List
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    """User question payload referencing an analyzed lease."""

    document_text: str = Field(min_length=10, description="Full text of the lease agreement")
    question: str = Field(min_length=3, max_length=500, description="User question about the lease terms")


class GroundedAnswerResponse(BaseModel):
    """Answer strictly grounded in document text with citations."""

    question: str = Field(description="Original user question")
    answer: str = Field(description="Grounded plain-language answer or strict refusal if unaddressed")
    citations: List[str] = Field(
        default_factory=list,
        description="Specific section/clause names or verbatim phrases cited as basis",
    )
    is_addressed_in_document: bool = Field(
        description="False if lease does not mention the topic and lawyer referral was returned"
    )
    disclaimer: str = Field(description="Mandatory legal disclaimer")
