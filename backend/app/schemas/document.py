"""
Pydantic models for document uploads and text extraction.
"""

from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    """Structured response returned after file upload and text extraction."""

    filename: str = Field(description="Sanitized name of the uploaded document")
    file_type: str = Field(description="Detected format ('pdf' or 'txt')")
    file_size_bytes: int = Field(description="File payload size in bytes")
    extracted_text: str = Field(description="Clean extracted text preserving paragraph boundaries")
    char_count: int = Field(description="Total character length of extracted text")
    estimated_clauses: int = Field(description="Estimated number of sections/clauses detected")
    disclaimer: str = Field(description="Mandatory legal disclaimer")


class TextInputRequest(BaseModel):
    """Payload for direct text submission or analysis requests."""

    text: str = Field(min_length=10, description="Raw or extracted lease agreement text")
    filename: str = Field(default="pasted_lease.txt", description="Optional reference filename")
