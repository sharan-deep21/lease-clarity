# Rental Agreement Assistant for First-Time Tenants

An AI-powered legal assistance tool engineered to empower first-time renters to inspect, understand, and navigate residential lease agreements before signing. The application translates dense legal boilerplate into plain, structured English, detects predatory or one-sided clauses with direct verbatim citations, answers tenant questions strictly grounded in the document, and generates tailored questions to take to a licensed attorney.

> **Legal Safety Disclaimer**: *This tool is strictly for informational and educational assistance and does NOT constitute professional legal advice. Users should always consult a licensed attorney for binding legal counsel.*

---

## Chosen Vertical

**AI for Legal Assistance & Access**

First-time tenants—such as college students, young professionals, and immigrant families—frequently face 15 to 40-page residential leases written in dense, archaic legalese. Due to high legal fees and time constraints, most renters sign without understanding hidden traps: non-refundable deposits masquerading as cleaning fees, unilateral entry clauses, mandatory arbitration waivers, automatic renewal traps, or improper repair liabilities. This project bridges that access gap by demystifying leases, safeguarding tenant rights, and preparing renters for informed legal consultations.

---

## Approach & Logic

Our engineering philosophy prioritizes **strict legal safety, hallucination elimination, prompt-injection defense, and radical accessibility**:

1. **In-Memory Zero-Persistence Processing**:
   - Uploaded lease files (PDF or plain text) are processed strictly in volatile system memory.
   - Files are never saved to disk or persistent databases, guaranteeing tenant confidentiality.

2. **Hierarchical Text & Clause Extraction**:
   - Extraction uses `pdfplumber` for precise paragraph and clause boundary preservation, falling back seamlessly to `pypdf` for corrupted or unusual PDF streams.
   - Text is cleaned and normalized while strictly preserving structural clause boundaries and section numbering.

3. **Multi-Layered Prompt-Injection Defense**:
   - Extracted document text is encapsulated within boundary delimiters (`<document>...</document>`).
   - System prompts explicitly command the model to analyze only the text within the tags and forbid following any imperative commands or overrides embedded inside the document content.

4. **Verbatim Grounded Citations**:
   - Every detected risk factor, summary point, and Q&A answer requires explicit quotation or section citation from the source document.
   - If an answer is not present in the lease, the system strictly outputs: *"This document doesn't address that — consider asking a lawyer"*, completely preventing hallucinatory legal interpretations.

5. **Attorney Checklist Synthesis**:
   - Risky and ambiguous clauses automatically feed into a focused checklist of questions for an attorney, maximizing the efficiency and affordability of any subsequent consultation with legal aid or a private lawyer.

---

## Demo

![demo](./demo.gif)

*(Placeholder for UI demonstration GIF / interactive walk-through screenshot)*

---

## How It Works

### Architecture Diagram

```
       ┌────────────────────────────────────────────────────────┐
       │                Accessible Web Interface                │
       │       (React 18 + Vite + Semantic Accessible CSS)      │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTPS / REST (JSON)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                 FastAPI Backend Server                 │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │ Security: Size Limit (5MB), Mime Check, Limiter  │  │
       │  └────────────────────────┬─────────────────────────┘  │
       │                           ▼                            │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │ In-Memory Extractor: pdfplumber -> pypdf fallback │  │
       │  └────────────────────────┬─────────────────────────┘  │
       │                           ▼                            │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │ Prompt Sanitizer & Injection Boundary Shield     │  │
       │  └────────────────────────┬─────────────────────────┘  │
       │                           ▼                            │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │ LLM Client: Google GenAI SDK (3x Backoff Retry)  │  │
       │  └──────────────────────────────────────────────────┘  │
       └───────────────────────────┬────────────────────────────┘
                                   │ TLS 1.3
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │              Google Gemini 2.5 Flash API               │
       └────────────────────────────────────────────────────────┘
```

### Core Pipeline Stages

1. **Document Validation & In-Memory Extraction**:
   - Server-side validation restricts uploads to `.pdf` and `.txt` up to 5 MB.
   - Extracts clean text while preserving paragraph and clause boundaries.
2. **Plain-Language Summary**:
   - Organizes content into 6 essential renter domains: **Rent & Payments**, **Security Deposit**, **Lease Term & Renewal**, **Termination & Eviction**, **Maintenance & Repairs**, and **House Rules / Other**.
3. **Risk & Red-Flag Detector**:
   - Audits for tenant-unfavorable clauses: non-refundable deposits, unilateral landlord entry, excessive late fees, liquidated damages, waiver of tenant statutory rights, and unfair indemnity clauses.
   - Highlights exact verbatim quotes for every flagged clause.
4. **Grounded Q&A Engine**:
   - Answers questions strictly using facts present in the text with section citations.
   - Refuses out-of-scope inquiries with safe referral advice.
5. **Lawyer Consultation Checklist**:
   - Synthesizes findings into an actionable, prioritized consultation sheet.
6. **Two-Document Comparison (Bonus)**:
   - Evaluates changes between original and revised lease proposals.

---

## Setup & Run Instructions

Follow these exact steps from a clean clone to run both the backend and frontend.

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Environment Setup
```bash
git clone <YOUR_PUBLIC_REPO_URL>
cd rental-agreement-assistant

# Create .env from the template
cp .env.example .env
# Edit .env to add your GEMINI_API_KEY:
# GEMINI_API_KEY=AIzaSy...
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install pinned dependencies
pip install -r requirements.txt

# Run backend server (defaults to port 8000)
python run.py
```
Backend will be live at `http://127.0.0.1:8000` (OpenAPI docs at `http://127.0.0.1:8000/docs`).

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install pinned dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## Assumptions Made

1. **Residential Leases**: Designed primarily for standard residential lease agreements (apartments, condominiums, single-family homes). Commercial leases with complex industrial covenants are out of primary scope.
2. **Language**: Primary analysis is tuned for English-language leases; non-English documents are detected and flagged.
3. **Document Quality**: Text PDFs or clean scans with extractable text layers. Scanned bitmap PDFs without OCR text layers are prompted for text conversion.
4. **Session Ephemerality**: Renters prefer zero trace of their personal financial and housing data; hence, no database persistence is maintained across server restarts.

---

## Security Considerations

- **Strict File Hygiene**: Filenames are sanitized, removing path traversal tokens (`..`, `/`, `\`), null bytes, and non-alphanumeric characters.
- **Payload Boundaries**: 5 MB file size limit strictly enforced on the server before reading stream into memory.
- **Rate Limiting**: Sliding-window rate limiting per client IP to safeguard LLM quotas and mitigate denial-of-service attempts.
- **In-Memory Processing**: File buffers are garbage collected after extraction; zero temporary files linger on the file system.
- **Prompt Injection Defense**: Document text is isolated inside `<document>` tags. Prompts explicitly forbid following instructions found within uploaded text.
- **Information Masking**: Internal tracebacks, API keys, and vendor exception details are caught and masked; the user only receives friendly, actionable error messages.
- **Legal Output Enclosure**: Every AI-generated output is appended with a prominent, unskippable legal disclaimer.

---

## Testing

The project includes unit, integration, and security edge-case tests executed via `pytest`.

To run the full test suite:
```bash
cd backend
pytest -v ../tests
```

### Test Coverage Includes:
- **Unit Tests**:
  - `test_extractor.py`: PDF and text parsing, paragraph preservation, fallback parser.
  - `test_validation.py`: File size enforcement (>5MB), rejected file extensions, empty documents.
  - `test_risk_detector.py`: Red-flag clause identification and verbatim quote verification.
  - `test_qa_engine.py`: Grounded answers, mandatory citations, out-of-scope refusal logic, and prompt-injection defense.
  - `test_lawyer_checklist.py`: Attorney question generation logic.
  - `test_error_handling.py`: Exponential backoff retries (3 attempts), rate-limit resilience, graceful error mapping.
- **Integration Tests**:
  - `test_integration.py`: Complete workflow from file upload to summary, risk flags, Q&A, and lawyer checklist using sample lease fixture.

---

## Known Limitations

1. **Gemini Free Tier Data Policy**: The free tier of the Gemini API may use submitted prompts and completions to train and improve Google's products. **Do not use this demo with real personal lease documents containing sensitive identifying data.** Always use sample, synthetic, or fully redacted lease agreements for testing and demonstration.
2. **OCR Limitations**: Documents must contain an extractable text stream. Pure image scans without embedded text are flagged for manual text input.
3. **Jurisdiction Specificity**: Landlord-tenant laws differ markedly across states, municipalities, and countries (e.g., rent control ordinances). The tool identifies generally tenant-unfavorable conditions but cannot provide jurisdiction-specific statutory determinations without a licensed local attorney.
