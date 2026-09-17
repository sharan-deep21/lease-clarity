"""
Unit tests for file upload validation, security sanitization, and size limits.
"""

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.utils.security import sanitize_filename, validate_file_upload, sanitize_extracted_text


class TestFilenameSanitization:
    """Test defense against path traversal and malicious filenames."""

    def test_path_traversal_stripping(self):
        malicious = "../../../etc/passwd"
        cleaned = sanitize_filename(malicious)
        assert "/" not in cleaned
        assert "\\" not in cleaned
        assert not cleaned.startswith(".")
        assert "passwd" in cleaned

    def test_windows_traversal_stripping(self):
        malicious = "..\\..\\boot.ini"
        cleaned = sanitize_filename(malicious)
        assert "\\" not in cleaned
        assert "boot.ini" in cleaned

    def test_null_byte_removal(self):
        malicious = "lease\x00.pdf"
        cleaned = sanitize_filename(malicious)
        assert "\x00" not in cleaned
        assert cleaned == "lease.pdf"

    def test_empty_filename_fallback(self):
        assert sanitize_filename("") == "unnamed_document.txt"
        assert sanitize_filename(None) == "unnamed_document.txt"


class TestUploadValidation:
    """Test server-side file format and size constraints."""

    def test_empty_file_rejection(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_file_upload("lease.txt", b"", max_size_bytes=5 * 1024 * 1024)
        assert exc_info.value.status_code == 400
        assert "empty" in exc_info.value.detail.lower()

    def test_oversized_file_rejection(self):
        max_bytes = 5 * 1024 * 1024
        oversized = b"A" * (max_bytes + 1024)
        with pytest.raises(HTTPException) as exc_info:
            validate_file_upload("lease.txt", oversized, max_size_bytes=max_bytes)
        assert exc_info.value.status_code == 413
        assert "exceeds" in exc_info.value.detail.lower()

    def test_unsupported_file_extension_rejection(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_file_upload("document.docx", b"dummy content", max_size_bytes=5 * 1024 * 1024)
        assert exc_info.value.status_code == 400
        assert "unsupported file type" in exc_info.value.detail.lower()

    def test_invalid_pdf_header_rejection(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_file_upload("fake.pdf", b"NOT_A_REAL_PDF_HEADER", max_size_bytes=5 * 1024 * 1024)
        assert exc_info.value.status_code == 400
        assert "invalid pdf" in exc_info.value.detail.lower()

    def test_valid_pdf_header_acceptance(self):
        ext = validate_file_upload("good.pdf", b"%PDF-1.5 test document", max_size_bytes=5 * 1024 * 1024)
        assert ext == ".pdf"

    def test_valid_txt_acceptance(self):
        ext = validate_file_upload("terms.txt", b"Standard lease agreement text", max_size_bytes=5 * 1024 * 1024)
        assert ext == ".txt"


class TestTextSanitization:
    """Test preservation of paragraph structure while stripping control chars."""

    def test_control_character_stripping(self):
        raw = "Clause 1\x07: Rent payment\x0b is due."
        cleaned = sanitize_extracted_text(raw)
        assert "\x07" not in cleaned
        assert "\x0b" not in cleaned
        assert "Clause 1: Rent payment is due." in cleaned

    def test_paragraph_boundary_preservation(self):
        raw = "Section 1: Rent\n\nSection 2: Deposit\n\n\n\nSection 3: Term"
        cleaned = sanitize_extracted_text(raw)
        assert "Section 1: Rent\n\nSection 2: Deposit\n\nSection 3: Term" == cleaned


class TestUploadEndpointValidation:
    """Integration validation tests against the FastAPI endpoint."""

    def test_upload_empty_file_returns_400(self, client: TestClient):
        response = client.post(
            "/api/document/upload",
            files={"file": ("empty.txt", b"", "text/plain")},
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_upload_unsupported_file_returns_400(self, client: TestClient):
        response = client.post(
            "/api/document/upload",
            files={"file": ("contract.docx", b"PK...", "application/vnd.openxmlformats")},
        )
        assert response.status_code == 400
        assert "unsupported" in response.json()["detail"].lower()

    def test_upload_valid_sample_txt(self, client: TestClient, sample_lease_text: str):
        response = client.post(
            "/api/document/upload",
            files={"file": ("sample_lease.txt", sample_lease_text.encode("utf-8"), "text/plain")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "sample_lease.txt"
        assert data["file_type"] == "txt"
        assert data["char_count"] > 100
        assert data["estimated_clauses"] >= 5
        assert "informational only" in data["disclaimer"].lower()
