"""
End-to-end integration test covering the complete pipeline:
Upload -> Text Extraction -> Plain-Language Summary -> Risk Evaluation -> Grounded Q&A -> Lawyer Checklist.
"""

import json
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient


class TestFullIntegrationPipeline:
    """Test full user journey using the sample lease text fixture."""

    @pytest.mark.asyncio
    async def test_full_pipeline_flow(self, client: TestClient, sample_lease_text: str):
        # 1. Step 1: Upload Document
        upload_resp = client.post(
            "/api/document/upload",
            files={"file": ("sample_lease.txt", sample_lease_text.encode("utf-8"), "text/plain")},
        )
        assert upload_resp.status_code == 200
        extracted_data = upload_resp.json()
        assert extracted_data["filename"] == "sample_lease.txt"
        assert extracted_data["estimated_clauses"] >= 8
        clean_text = extracted_data["extracted_text"]

        # Mock LLM responses for the pipeline stages
        mock_summary = {
            "rent": "$2,100 per month, due on the 1st. Late fee of $150 after the 2nd day.",
            "deposit": "$3,000 security deposit, with $1,000 kept as non-refundable fee.",
            "term": "1-year lease from July 1, 2026 to June 30, 2027. Auto-renews unless 90 days notice given.",
            "termination": "Landlord can terminate on 3 days notice without cause.",
            "maintenance": "Tenant pays for repairs up to $500 per incident.",
            "other": "No pets allowed without consent. Quiet hours 10PM-8AM.",
        }

        mock_risks = {
            "overall_risk_score": "HIGH_RISK",
            "red_flags": [
                {
                    "clause_title": "Non-Refundable Deposit Fee",
                    "severity": "HIGH",
                    "category": "Security Deposit",
                    "risk_explanation": "Forfeiting $1,000 regardless of condition is highly unfavorable.",
                    "quoted_clause": "$1,000.00 shall be retained as a non-refundable administrative and re-keying fee",
                    "tenant_recommendation": "Negotiate to make entire deposit refundable subject to inspection.",
                },
                {
                    "clause_title": "Arbitrary Landlord Entry",
                    "severity": "HIGH",
                    "category": "Landlord Entry",
                    "risk_explanation": "Landlord can enter at any hour without notice.",
                    "quoted_clause": "enter the premises at any hour of the day or night without prior notice",
                    "tenant_recommendation": "Require 24-hour written notice for non-emergencies.",
                },
            ],
        }

        mock_qa = {
            "answer": "Yes, there is an immediate late fee of $150.00 if rent is paid after 11:59 PM on the 2nd day of the month.",
            "citations": ["SECTION 2: RENT AND PAYMENT TERMS", "late fee of $150.00 plus $15.00 per day"],
            "is_addressed_in_document": True,
        }

        mock_checklist = {
            "questions": [
                {
                    "topic": "Security Deposit Legality",
                    "question": "Is the $1,000 non-refundable fee enforceable under state security deposit limits?",
                    "reasoning": "State statute restricts non-refundable withholdings.",
                    "referenced_clause": "SECTION 3: SECURITY DEPOSIT",
                    "priority": "HIGH",
                }
            ]
        }

        with patch("app.services.summarizer.get_llm_service") as mock_get_sum_llm, \
             patch("app.services.risk_detector.get_llm_service") as mock_get_risk_llm, \
             patch("app.services.qa_engine.get_llm_service") as mock_get_qa_llm, \
             patch("app.services.lawyer_checklist.get_llm_service") as mock_get_chk_llm:

            # Setup mocks
            mock_sum_inst = AsyncMock()
            mock_sum_inst.generate.return_value = json.dumps(mock_summary)
            mock_get_sum_llm.return_value = mock_sum_inst

            mock_risk_inst = AsyncMock()
            mock_risk_inst.generate.return_value = json.dumps(mock_risks)
            mock_get_risk_llm.return_value = mock_risk_inst

            mock_qa_inst = AsyncMock()
            mock_qa_inst.generate.return_value = json.dumps(mock_qa)
            mock_get_qa_llm.return_value = mock_qa_inst

            mock_chk_inst = AsyncMock()
            mock_chk_inst.generate.return_value = json.dumps(mock_checklist)
            mock_get_chk_llm.return_value = mock_chk_inst

            # 2. Step 2: Full Analysis (Summary + Risks)
            analysis_resp = client.post(
                "/api/analysis/full",
                json={"text": clean_text, "filename": "sample_lease.txt"},
            )
            assert analysis_resp.status_code == 200
            analysis_data = analysis_resp.json()
            assert "$2,100" in analysis_data["summary"]["rent"]
            assert analysis_data["risk_analysis"]["overall_risk_score"] == "HIGH_RISK"
            assert len(analysis_data["risk_analysis"]["red_flags"]) == 2
            assert "informational only" in analysis_data["disclaimer"].lower()

            # 3. Step 3: Grounded Q&A
            qa_resp = client.post(
                "/api/qa/ask",
                json={
                    "document_text": clean_text,
                    "question": "Is there a late fee for rent?",
                },
            )
            assert qa_resp.status_code == 200
            qa_data = qa_resp.json()
            assert "$150.00" in qa_data["answer"]
            assert len(qa_data["citations"]) >= 1
            assert "SECTION 2" in qa_data["citations"][0]

            # 4. Step 4: Lawyer Consultation Checklist
            chk_resp = client.post(
                "/api/analysis/lawyer-checklist",
                json={"text": clean_text, "filename": "sample_lease.txt"},
            )
            assert chk_resp.status_code == 200
            chk_data = chk_resp.json()
            assert len(chk_data["questions"]) >= 1
            assert chk_data["questions"][0]["priority"] == "HIGH"
            assert "SECTION 3" in chk_data["questions"][0]["referenced_clause"]
