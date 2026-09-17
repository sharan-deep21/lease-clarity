"""
Pydantic models for structured lease summary and risk analysis.
"""

from typing import List, Literal
from pydantic import BaseModel, Field


class LeaseSummary(BaseModel):
    """Plain-language breakdown organized by the 6 core tenancy areas."""

    rent: str = Field(description="Summary of monthly rent, due dates, payment methods, and grace periods")
    deposit: str = Field(description="Summary of security deposit amounts, return timeline, and deduction rules")
    term: str = Field(description="Summary of lease start/end dates and renewal stipulations")
    termination: str = Field(description="Summary of termination rights, notice requirements, and penalties")
    maintenance: str = Field(description="Summary of repair responsibilities split between landlord and tenant")
    other: str = Field(description="Summary of house rules, pet policy, parking, guests, and quiet hours")
    disclaimer: str = Field(description="Mandatory legal disclaimer")


class RiskFlag(BaseModel):
    """An individual tenant-unfavorable or unusual clause detection."""

    clause_title: str = Field(description="Short descriptive name of the flagged clause")
    severity: Literal["HIGH", "MEDIUM", "LOW"] = Field(description="Risk severity level")
    category: str = Field(description="Clause category (e.g. Deposit, Termination, Entry, Repair)")
    risk_explanation: str = Field(description="Plain-English explanation of why this term is risky for a tenant")
    quoted_clause: str = Field(description="Verbatim quote or exact clause text from the lease")
    tenant_recommendation: str = Field(description="Practical action or negotiation tip for the renter")


class RiskAnalysisResponse(BaseModel):
    """Complete risk evaluation report for a lease agreement."""

    filename: str = Field(description="Document reference name")
    overall_risk_score: Literal["LOW_RISK", "MODERATE_RISK", "HIGH_RISK"] = Field(
        description="Overall lease favorability assessment"
    )
    red_flags: List[RiskFlag] = Field(default_factory=list, description="List of identified red-flag clauses")
    flag_count: int = Field(description="Total number of flagged items")
    disclaimer: str = Field(description="Mandatory legal disclaimer")


class FullAnalysisResponse(BaseModel):
    """Combined summary and risk report."""

    filename: str = Field(description="Document reference name")
    summary: LeaseSummary
    risk_analysis: RiskAnalysisResponse
    disclaimer: str
