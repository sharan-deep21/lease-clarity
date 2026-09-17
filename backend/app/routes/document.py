"""
Endpoints for document upload and in-memory text extraction.
"""

import os
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import Settings, get_settings
from app.schemas.document import DocumentUploadResponse, TextInputRequest
from app.services.extractor import count_clauses, extract_document_text
from app.utils.rate_limiter import rate_limit_dependency
from app.utils.security import sanitize_extracted_text, sanitize_filename, validate_file_upload


router = APIRouter(prefix="/api/document", tags=["Document"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_dependency)],
    summary="Upload a lease agreement (PDF or TXT) and extract text in memory",
)
async def upload_document(
    file: UploadFile = File(..., description="Lease agreement document (PDF or TXT, max 5MB)"),
    settings: Settings = Depends(get_settings),
) -> DocumentUploadResponse:
    """
    Accepts a PDF or plain text lease agreement up to 5MB, validates file integrity,
    and extracts text strictly in memory preserving clause boundaries.
    """
    raw_filename = file.filename or "lease_document.txt"
    clean_name = sanitize_filename(raw_filename)

    # Read payload asynchronously into memory
    content = await file.read()

    # Validate file size and format
    ext = validate_file_upload(
        filename=clean_name,
        content=content,
        max_size_bytes=settings.max_file_size_bytes,
    )

    # Extract text strictly in memory
    extracted_text, clause_count = extract_document_text(content, ext)

    return DocumentUploadResponse(
        filename=clean_name,
        file_type=ext.lstrip(".").lower(),
        file_size_bytes=len(content),
        extracted_text=extracted_text,
        char_count=len(extracted_text),
        estimated_clauses=clause_count,
        disclaimer=settings.mandatory_legal_disclaimer,
    )


@router.post(
    "/parse-text",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_dependency)],
    summary="Submit raw lease text directly for extraction and analysis",
)
async def parse_direct_text(
    payload: TextInputRequest,
    settings: Settings = Depends(get_settings),
) -> DocumentUploadResponse:
    """
    Processes directly pasted lease text into normalized format.
    """
    clean_text = sanitize_extracted_text(payload.text)
    if not clean_text or len(clean_text) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pasted text is too short to be a valid lease agreement.",
        )

    clause_count = count_clauses(clean_text)
    clean_name = sanitize_filename(payload.filename)

    return DocumentUploadResponse(
        filename=clean_name,
        file_type="txt",
        file_size_bytes=len(payload.text.encode("utf-8")),
        extracted_text=clean_text,
        char_count=len(clean_text),
        estimated_clauses=clause_count,
        disclaimer=settings.mandatory_legal_disclaimer,
    )
