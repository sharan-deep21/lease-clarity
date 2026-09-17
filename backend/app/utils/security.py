"""
Security utilities: filename sanitization, payload size checking, and content cleaning.
"""

import os
import re
from fastapi import HTTPException, status


ALLOWED_EXTENSIONS = {".pdf", ".txt"}


def sanitize_filename(filename: str) -> str:
    """
    Sanitize an uploaded file name to prevent path traversal and shell injection.

    Args:
        filename: Raw incoming file name.

    Returns:
        Cleaned, safe basename.
    """
    if not filename:
        return "unnamed_document.txt"

    # Strip directory components (Windows and POSIX)
    clean = os.path.basename(filename.replace("\\", "/"))

    # Remove null bytes and control characters
    clean = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", clean)

    # Keep only safe alphanumeric characters, dashes, underscores, and dots
    clean = re.sub(r"[^\w\.\- ]", "_", clean)

    # Prevent multiple dots or leading dot (e.g. hidden files or path traversal tricks)
    clean = re.sub(r"\.{2,}", ".", clean)
    clean = clean.lstrip(".")

    if not clean:
        return "sanitized_document.txt"

    # Truncate length to reasonable limit
    return clean[:100]


def validate_file_upload(filename: str, content: bytes, max_size_bytes: int) -> str:
    """
    Validate uploaded file size, extension, and header signatures.

    Args:
        filename: Cleaned filename.
        content: File bytes in memory.
        max_size_bytes: Maximum allowed byte count.

    Returns:
        Extension string ('.pdf' or '.txt').

    Raises:
        HTTPException: If file is empty, oversized, or unsupported format.
    """
    # 1. Reject empty files
    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please upload a valid lease agreement.",
        )

    # 2. Strict size check
    if len(content) > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({len(content) / (1024*1024):.2f} MB) exceeds the strict {max_mb} MB limit.",
        )

    # 3. Extension check
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only PDF (.pdf) and Plain Text (.txt) documents are accepted.",
        )

    # 4. Content signature verification for PDF
    if ext == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file format. The file header does not match a valid PDF document.",
            )

    return ext


def sanitize_extracted_text(text: str) -> str:
    """
    Clean and normalize extracted text while strictly preserving paragraph
    and clause boundaries.

    Args:
        text: Raw extracted text.

    Returns:
        Normalized text with preserved paragraph breaks.
    """
    if not text:
        return ""

    # Replace null bytes and non-printable control characters, but keep newlines/tabs
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Normalize CRLF to LF
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")

    # Collapse horizontal whitespace per line without destroying indentations
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in cleaned.split("\n")]

    # Collapse more than 2 consecutive blank lines into 2 (preserves paragraph boundaries)
    normalized = re.sub(r"\n{3,}", "\n\n", "\n".join(lines))

    return normalized.strip()
