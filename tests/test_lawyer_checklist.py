"""
Unit tests for attorney question checklist generator.
"""

import json
from unittest.mock import AsyncMock
import pytest

from app.schemas.analysis import RiskFlag
from app.schemas.comparison import LawyerChecklistResponse
from app.services.lawyer_checklist import generate_lawyer_checklist, build_checklist_prompt


class TestLawyerChecklistGenerator:
    """Test synthesis of red flags into prioritized attorney questions."""

    @pytest.mark.asyncio
    async def test_generate_checklist_from_red_flags(self, sample_lease_text: str):
        sample_flags = [
            RiskFlag(
                clause_title="Non-Refundable Deposit",
                severity="HIGH",
                category="Security Deposit",
                risk_explanation="Retaining $1,000 as non-refundable fee.",
                quoted_clause="$1,000.00 shall be retained as a non-refundable administrative and re-keying fee",
                tenant_recommendation="Ask attorney whether mandatory fee is legal.",
            ),
            RiskFlag(
                clause_title="Unilateral Right of Entry",
                severity="HIGH",
                category="Landlord Entry",
                risk_explanation="Entry at any hour without notice.",
                quoted_clause="enter the premises at any hour of the day or night without prior notice",
                tenant_recommendation="Demand 24-hour advance written notice clause.",
            ),
        ]

        mock_llm_response = {
            "questions": [
                {
                    "topic": "Security Deposit Forfeiture",
                    "question": "Can the landlord legally retain $1,000 as a non-refundable fee under our state deposit statute?",
                    "reasoning": "State law typically mandates that all deposits are refundable less actual damage.",
                    "referenced_clause": "SECTION 3: SECURITY DEPOSIT",
                    "priority": "HIGH",
                },
                {
                    "topic": "Unrestricted Entry Rights",
                    "question": "Does Section 5 violate my statutory covenant of quiet enjoyment by allowing unannounced entry?",
                    "reasoning": "State civil codes require at least 24 hours written notice for non-emergency entries.",
                    "referenced_clause": "SECTION 5: LANDLORD RIGHT OF ENTRY",
                    "priority": "HIGH",
                },
            ]
        }

        mock_llm = AsyncMock()
        mock_llm.generate.return_value = json.dumps(mock_llm_response)

        result: LawyerChecklistResponse = await generate_lawyer_checklist(
            document_text=sample_lease_text,
            red_flags=sample_flags,
            filename="sample_lease.txt",
            llm_service=mock_llm,
        )

        assert len(result.questions) == 2
        assert result.questions[0].priority == "HIGH"
        assert "SECTION 3" in result.questions[0].referenced_clause
        assert "SECTION 5" in result.questions[1].referenced_clause
        assert "informational only" in result.disclaimer.lower()
