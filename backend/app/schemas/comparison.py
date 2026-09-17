"""
Pydantic models for attorney checklist and two-document lease comparison.
"""

from typing import List, Literal
from pydantic import BaseModel, Field


class LawyerQuestionItem(BaseModel):
    """An individual recommended question for an attorney."""

    topic: str = Field(description="The underlying clause topic (e.g., Security Deposit, Entry)")
    question: str = Field(description="Clear, specific question for the lawyer")
    reasoning: str = Field(description="Why this question is critical given the lease clause")
    referenced_clause: str = Field(description="Clause or term referenced")
    priority: Literal["HIGH", "MEDIUM", "LOW"] = Field(description="Importance priority")


class LawyerChecklistResponse(BaseModel):
    """Actionable checklist of questions for legal counsel."""

    filename: str = Field(description="Document reference name")
    questions: List[LawyerQuestionItem] = Field(description="Prioritized questions for an attorney")
    disclaimer: str = Field(description="Mandatory legal disclaimer")


class ClauseChangeItem(BaseModel):
    """Specific term change between two lease versions."""

    section: str = Field(description="Section or clause title")
    change_type: Literal["ADDED", "MODIFIED", "REMOVED"] = Field(description="Type of difference")
    impact_on_tenant: Literal["MORE_FAVORABLE", "LESS_FAVORABLE", "NEUTRAL"] = Field(
        description="Tenant impact evaluation"
    )
    original_text: str = Field(default="", description="Original wording")
    revised_text: str = Field(default="", description="Revised wording")
    analysis: str = Field(description="Plain-English explanation of what changed and why it matters")


class ComparisonRequest(BaseModel):
    """Payload to compare two lease versions."""

    original_text: str = Field(min_length=10, description="Original lease document text")
    revised_text: str = Field(min_length=10, description="Revised or secondary lease document text")
    original_filename: str = Field(default="original_lease.txt", description="Original file label")
    revised_filename: str = Field(default="revised_lease.txt", description="Revised file label")


class ComparisonResponse(BaseModel):
    """Structured comparison differences between two leases."""

    original_filename: str
    revised_filename: str
    overview: str = Field(description="High-level summary of revisions")
    differences: List[ClauseChangeItem] = Field(description="Clause-by-clause changes")
    net_assessment: str = Field(description="Whether the revised lease is better or worse for the tenant")
    disclaimer: str = Field(description="Mandatory legal disclaimer")
