"""
In-memory document text extraction service.
Supports plain text and PDF via pdfplumber with seamless fallback to pypdf.
"""

import io
import re
import logging
from typing import Tuple
from fastapi import HTTPException, status
try:
    import pdfplumber
except Exception:
    pdfplumber = None
import pypdf

from app.utils.security import sanitize_extracted_text


logger = logging.getLogger(__name__)


def count_clauses(text: str) -> int:
    """
    Estimate the number of sections or clauses present in the text.
    Looks for standard patterns like 'SECTION 1', 'Clause 3', 'Article IV', '1.', etc.
    """
    if not text:
        return 0

    patterns = [
        r"(?i)\b(?:section|clause|article|paragraph)\s+[0-9a-zA-Z\.\-]+",
        r"(?m)^\s*(?:[0-9]{1,2}|[A-Z])[\.\)]\s+[A-Z]",
    ]

    matches = set()
    for pat in patterns:
        for m in re.finditer(pat, text):
            matches.add(m.group(0).strip())

    return max(1, len(matches))


def extract_from_plain_text(content: bytes) -> str:
    """
    Decode plain text bytes with fallback encodings.

    Args:
        content: Raw bytes.

    Returns:
        Decoded text string.

    Raises:
        HTTPException: If decoding fails with all candidate encodings.
    """
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
    for enc in encodings:
        try:
            return content.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Unable to decode text document. Please ensure the file uses standard UTF-8 encoding.",
    )


def extract_from_pdf(content: bytes) -> str:
    """
    Extract clean text from PDF bytes strictly in memory.
    Uses pdfplumber for high-fidelity clause/layout preservation,
    with an automatic fallback to pypdf if pdfplumber encounters an error.

    Args:
        content: Raw PDF bytes.

    Returns:
        Extracted text preserving paragraph and clause breaks.

    Raises:
        HTTPException: If PDF is corrupted or yields no readable text.
    """
    extracted_pages = []
    pdfplumber_failed = False

    # Attempt primary extraction with pdfplumber
    try:
        if pdfplumber is None:
            pdfplumber_failed = True
        else:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                if not pdf.pages:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="The PDF contains no pages.",
                    )
                for page_idx, page in enumerate(pdf.pages):
                    text = page.extract_text(layout=False) or ""
                    if text.strip():
                        extracted_pages.append(text.strip())
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"pdfplumber extraction encountered an error ({exc}). Attempting pypdf fallback.")
        pdfplumber_failed = True

    # Fallback to pypdf if pdfplumber failed or yielded zero text
    if pdfplumber_failed or not extracted_pages:
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            if reader.is_encrypted:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The uploaded PDF is password-protected or encrypted. Please remove encryption before uploading.",
                )
            for page in reader.pages:
                text = page.extract_text() or ""
                if text.strip():
                    extracted_pages.append(text.strip())
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Both pdfplumber and pypdf failed to parse PDF: {exc}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The PDF file appears corrupted or unreadable. Please check the file or copy-paste the text directly.",
            )

    full_text = "\n\n".join(extracted_pages)
    cleaned_text = sanitize_extracted_text(full_text)

    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No readable text could be found in the PDF. If this document is a scanned image, please run OCR or paste the text directly.",
        )

    return cleaned_text


def extract_document_text(content: bytes, ext: str) -> Tuple[str, int]:
    """
    Dispatcher to extract text from PDF or TXT bytes in memory.

    Args:
        content: Raw document bytes.
        ext: File extension ('.pdf' or '.txt').

    Returns:
        Tuple of (clean_text, estimated_clauses).
    """
    if ext == ".txt":
        raw_text = extract_from_plain_text(content)
        cleaned = sanitize_extracted_text(raw_text)
        if not cleaned:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The text file does not contain readable characters.",
            )
        clauses = count_clauses(cleaned)
        return cleaned, clauses
    elif ext == ".pdf":
        cleaned = extract_from_pdf(content)
        clauses = count_clauses(cleaned)
        return cleaned, clauses
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only PDF and TXT files are supported.",
        )
