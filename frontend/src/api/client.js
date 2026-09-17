/**
 * API client for interacting with the FastAPI backend.
 * Provides resilient error parsing and user-friendly error formatting.
 */

const API_BASE = '/api';

/**
 * Helper to process JSON response and handle error payloads gracefully.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data && data.detail) {
        errorDetail = data.detail;
      }
    } catch {
      // Non-JSON response
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export async function checkHealth() {
  const resp = await fetch(`${API_BASE}/health`);
  return handleResponse(resp);
}

export async function uploadDocumentFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const resp = await fetch(`${API_BASE}/document/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(resp);
}

export async function submitDirectText(text, filename = 'pasted_lease.txt') {
  const resp = await fetch(`${API_BASE}/document/parse-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename }),
  });
  return handleResponse(resp);
}

export async function fetchFullAnalysis(text, filename = 'lease.txt') {
  const resp = await fetch(`${API_BASE}/analysis/full`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename }),
  });
  return handleResponse(resp);
}

export async function askLeaseQuestion(documentText, question) {
  const resp = await fetch(`${API_BASE}/qa/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_text: documentText,
      question,
    }),
  });
  return handleResponse(resp);
}

export async function fetchLawyerChecklist(text, filename = 'lease.txt') {
  const resp = await fetch(`${API_BASE}/analysis/lawyer-checklist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename }),
  });
  return handleResponse(resp);
}

export async function compareLeaseDocuments(originalText, revisedText, originalFilename, revisedFilename) {
  const resp = await fetch(`${API_BASE}/comparison/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original_text: originalText,
      revised_text: revisedText,
      original_filename: originalFilename,
      revised_filename: revisedFilename,
    }),
  });
  return handleResponse(resp);
}
