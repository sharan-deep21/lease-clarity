"""
Unit tests for lease risk and red-flag detector.
Verifies identification of tenant-unfavorable clauses, verbatim quote requirements,
and low-risk scoring on clean leases.
"""

import json
from unittest.mock import AsyncMock, patch
import pytest

from app.schemas.analysis import RiskAnalysisResponse, RiskFlag
from app.services.risk_detector import detect_lease_risks, build_risk_prompt


class TestRiskDetectorLogic:
    """Test risk detection prompting and structured response parsing."""

    def test_prompt_includes_document_delimiters(self, sample_lease_text: str):
        prompt = build_risk_prompt(sample_lease_text)
        assert "<document>" in prompt
        assert "</document>" in prompt
        assert "Apex Properties LLC" in prompt
        assert "Non-refundable security deposits" in prompt

    @pytest.mark.asyncio
    async def test_detect_risks_in_sample_lease(self, sample_lease_text: str):
        mock_llm_response = {
            "overall_risk_score": "HIGH_RISK",
            "red_flags": [
                {
                    "clause_title": "Non-Refundable Deposit Retainer",
                    "severity": "HIGH",
                    "category": "Security Deposit",
                    "risk_explanation": "Retaining $1,000 as non-refundable administrative fee regardless of condition violates tenant protection standards.",
                    "quoted_clause": "$1,000.00 shall be retained as a non-refundable administrative and re-keying fee regardless of the condition of the premises upon move-out.",
                    "tenant_recommendation": "Request removal of the non-refundable portion.",
                },
                {
                    "clause_title": "Unrestricted Landlord Entry",
                    "severity": "HIGH",
                    "category": "Landlord Entry",
                    "risk_explanation": "Permits entry at any hour without notice.",
                    "quoted_clause": "Landlord and Landlord's authorized agents may enter the premises at any hour of the day or night without prior notice.",
                    "tenant_recommendation": "Demand standard 24-hour advance written notice requirement.",
                },
                {
                    "clause_title": "Waiver of Landlord Negligence",
                    "severity": "HIGH",
                    "category": "Liability Waiver",
                    "risk_explanation": "Waives tenant claims even for gross negligence or intentional misconduct.",
                    "quoted_clause": "Tenant expressly waives all rights of action... even if caused by Landlord's gross negligence.",
                    "tenant_recommendation": "Do not sign this waiver; liability for gross negligence is generally non-waivable.",
                },
            ],
        }

        mock_service = AsyncMock()
        mock_service.generate.return_value = json.dumps(mock_llm_response)

        result: RiskAnalysisResponse = await detect_lease_risks(
            document_text=sample_lease_text,
            filename="sample_lease.txt",
            llm_service=mock_service,
        )

        assert result.overall_risk_score == "HIGH_RISK"
        assert result.flag_count == 3
        for flag in result.red_flags:
            assert isinstance(flag, RiskFlag)
            assert flag.severity in ("HIGH", "MEDIUM", "LOW")
            # Verify mandatory quotation exists
            assert len(flag.quoted_clause) > 10
            assert flag.tenant_recommendation
        assert "informational only" in result.disclaimer.lower()

    @pytest.mark.asyncio
    async def test_detect_zero_risks_in_safe_lease(self, safe_lease_text: str):
        mock_llm_response = {
            "overall_risk_score": "LOW_RISK",
            "red_flags": [],
        }

        mock_service = AsyncMock()
        mock_service.generate.return_value = json.dumps(mock_llm_response)

        result = await detect_lease_risks(
            document_text=safe_lease_text,
            filename="safe_lease.txt",
            llm_service=mock_service,
        )

        assert result.overall_risk_score == "LOW_RISK"
        assert result.flag_count == 0
        assert len(result.red_flags) == 0
