"""
Unit tests for document text extraction and parser fallback logic.
"""

from pathlib import Path
from unittest.mock import patch
import pytest
from fastapi import HTTPException

from app.services.extractor import (
    count_clauses,
    extract_from_plain_text,
    extract_from_pdf,
    extract_document_text,
)


class TestTextExtraction:
    """Test plain text extraction and encoding resilience."""

    def test_plain_text_utf8(self, sample_lease_text: str):
        content = sample_lease_text.encode("utf-8")
        extracted, clauses = extract_document_text(content, ".txt")
        assert "Apex Properties LLC" in extracted
        assert "SECTION 2: RENT" in extracted
        assert clauses >= 8

    def test_plain_text_latin1_fallback(self):
        # Text with latin-1 specific character (e.g. accents and eñe)
        latin1_content = "Clausula 1: Renta fijada cada ano con fianza de senal.".encode("latin-1")
        decoded = extract_from_plain_text(latin1_content)
        assert "Clausula 1: Renta fijada" in decoded

    def test_clause_counting(self):
        sample = """
        SECTION 1: TERM
        This is term.

        SECTION 2: RENT
        This is rent.

        SECTION 3: DEPOSIT
        This is deposit.
        """
        assert count_clauses(sample) == 3


class TestPDFExtractionResilience:
    """Test PDF extraction, fallback to pypdf, and corrupted file handling."""

    def test_corrupted_pdf_raises_422(self, corrupted_pdf_path: Path):
        content = corrupted_pdf_path.read_bytes()
        with pytest.raises(HTTPException) as exc_info:
            extract_from_pdf(content)
        assert exc_info.value.status_code == 422
        assert "corrupted" in exc_info.value.detail.lower() or "unreadable" in exc_info.value.detail.lower()

    def test_pdfplumber_fallback_to_pypdf_on_error(self):
        """Simulate pdfplumber failure to ensure pypdf fallback succeeds."""
        # Create a tiny mock where pdfplumber throws and pypdf returns text
        with patch("app.services.extractor.pdfplumber.open", side_effect=Exception("pdfplumber stream crash")):
            with patch("app.services.extractor.pypdf.PdfReader") as mock_reader_cls:
                mock_page = type("Page", (), {"extract_text": lambda self: "Fallback extracted lease text from pypdf."})()
                mock_reader_cls.return_value.pages = [mock_page]
                mock_reader_cls.return_value.is_encrypted = False

                dummy_pdf_bytes = b"%PDF-1.4 dummy"
                result = extract_from_pdf(dummy_pdf_bytes)
                assert "Fallback extracted lease text from pypdf" in result
