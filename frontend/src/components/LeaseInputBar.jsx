import React, { useState, useRef } from 'react';
import {
  Paperclip,
  Sparkles,
  ArrowUp,
  X,
  FileText,
  RotateCcw,
  ShieldAlert,
  Clock,
  RefreshCw,
  Scale,
} from 'lucide-react';

export const SAMPLE_LEASE_TEXT = `STANDARD RESIDENTIAL LEASE AGREEMENT

This Agreement is entered into on June 1, 2026, between Apex Properties LLC ("Landlord") and Jane Doe ("Tenant") for the premises located at 124 Elm Street, Apt 3B, Springfield.

SECTION 1: TERM
The initial term of this lease shall commence on July 1, 2026, and expire on June 30, 2027 ("Lease Term").

SECTION 2: RENT AND PAYMENT TERMS
Tenant agrees to pay monthly rent in the amount of $2,100.00, due on the first calendar day of each month. Payments made after 11:59 PM on the 2nd day of the month shall incur an immediate late fee of $150.00 plus $15.00 per day thereafter.

SECTION 3: SECURITY DEPOSIT
Tenant shall deposit with Landlord the sum of $3,000.00 upon execution of this Agreement. Of this sum, $1,000.00 shall be retained as a non-refundable administrative and re-keying fee regardless of the condition of the premises upon move-out. The remaining $2,000.00 shall be returned within 60 days following full vacancy, subject to deductions.

SECTION 4: AUTOMATIC RENEWAL
Upon expiration of the initial term, this Agreement shall automatically renew for successive twelve (12) month terms unless Tenant provides written notice via certified mail at least ninety (90) days prior to the expiration date. Landlord reserves the right upon renewal to increase rent by up to 25% without prior tenant negotiation.

SECTION 5: LANDLORD RIGHT OF ENTRY
Landlord and Landlord's authorized agents may enter the premises at any hour of the day or night without prior notice to Tenant for inspections, repairs, showings, or any arbitrary reason deemed necessary by Landlord.

SECTION 6: MAINTENANCE AND REPAIRS
Tenant agrees to maintain the premises in good order. Tenant is solely responsible for all plumbing, HVAC, electrical, and appliance repairs costing up to $500.00 per occurrence, regardless of whether damage resulted from ordinary wear and tear.

SECTION 7: TERMINATION AND DEFAULT
Landlord may terminate this lease and demand immediate surrender of the premises upon three (3) days written notice for any reason or no reason whatsoever. If Tenant terminates the lease prior to the expiration date, Tenant remains liable for the full remaining rent balance for the entire 12-month term plus a liquidated damages penalty of $3,000.00.

SECTION 8: WAIVER OF LIABILITY AND SUBROGATION
Tenant expressly waives all rights of action, claims, and statutory remedies against Landlord for any personal injury, death, or property damage occurring on the premises, even if caused by Landlord's gross negligence, failure to maintain structural integrity, or intentional misconduct.

SECTION 9: RULES AND PETS
No pets are permitted under any circumstances without prior written consent. Quiet hours are enforced between 10:00 PM and 8:00 AM.`;

export function LeaseInputBar({
  onFileUpload,
  onTextSubmit,
  onQuestionSubmit,
  currentDoc = null,
  isProcessing = false,
  onResetDocument = null,
}) {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndAttachFile(file);
  };

  const validateAndAttachFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt'].includes(ext)) {
      alert('Please attach a PDF (.pdf) or Plain Text (.txt) rental agreement.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      return;
    }
    setAttachedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      validateAndAttachFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    if (attachedFile) {
      onFileUpload(attachedFile);
      setAttachedFile(null);
      setInputText('');
      return;
    }

    if (currentDoc && inputText.trim().length > 0) {
      if (onQuestionSubmit) {
        onQuestionSubmit(inputText.trim());
        setInputText('');
      }
      return;
    }

    if (inputText.trim().length >= 10) {
      onTextSubmit(inputText.trim(), 'pasted_lease_agreement.txt');
      setInputText('');
    } else if (inputText.trim().length > 0) {
      alert('Please paste at least 10 characters of lease text or attach a file.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSampleClick = () => {
    onTextSubmit(SAMPLE_LEASE_TEXT, 'sample_springfield_lease.txt');
  };

  const isSendActive = (inputText.trim().length > 0 || attachedFile !== null) && !isProcessing;

  const placeholderText = isProcessing
    ? 'Analyzing lease agreement with AI reasoning...'
    : currentDoc
    ? 'Ask a specific question about this lease (e.g. "Can landlord enter without 24 hours notice?")...'
    : 'Paste lease text here, attach a PDF/TXT document, or ask a question...';

  return (
    <div className="claude-input-section" role="region" aria-label="Lease Document Submission">
      {/* Floating Glass Prompt Card */}
      <div
        className={`claude-prompt-card ${isDragOver ? 'is-dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          tabIndex={-1}
        />

        {/* Active Document Status Pill inside card */}
        {currentDoc && (
          <div className="claude-attachment-chip active-doc-chip" role="status">
            <div className="active-file-icon" aria-hidden="true">
              <FileText size={16} />
            </div>
            <div className="attachment-details">
              <div className="attachment-title-line">
                <span className="attachment-name">{currentDoc.filename}</span>
                <span className="active-status-tag">Active Agreement</span>
              </div>
              <span className="attachment-size">
                {currentDoc.estimated_clauses} clauses identified • {currentDoc.char_count?.toLocaleString()} characters
              </span>
            </div>
            {onResetDocument && (
              <button
                type="button"
                className="btn-change-doc"
                onClick={onResetDocument}
                title="Upload different document"
                aria-label="Upload different document"
              >
                <RotateCcw size={12} aria-hidden="true" />
                <span>Change</span>
              </button>
            )}
          </div>
        )}

        {/* Draft Attached File Chip inside card */}
        {!currentDoc && attachedFile && (
          <div className="claude-attachment-chip" role="status">
            <div className="active-file-icon" aria-hidden="true">
              <FileText size={16} />
            </div>
            <div className="attachment-details">
              <span className="attachment-name">{attachedFile.name}</span>
              <span className="attachment-size">
                {(attachedFile.size / 1024).toFixed(1)} KB • Ready for upload
              </span>
            </div>
            <button
              type="button"
              className="btn-remove-attachment"
              onClick={() => setAttachedFile(null)}
              title="Remove file"
              aria-label="Remove attached file"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          className="claude-prompt-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={isProcessing}
          rows={3}
        />

        {/* Bottom Actions Bar */}
        <div className="claude-prompt-actions">
          <div className="actions-left">
            <button
              type="button"
              className="claude-action-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              title="Upload PDF or TXT rental agreement"
            >
              <Paperclip size={15} aria-hidden="true" />
              <span>Upload New</span>
            </button>

            {!currentDoc && (
              <button
                type="button"
                className="claude-action-btn btn-sample-ghost"
                onClick={handleSampleClick}
                disabled={isProcessing}
                title="Load pre-configured Springfield sample lease"
              >
                <Sparkles size={15} className="pill-icon text-amber" aria-hidden="true" />
                <span>Try Sample Lease</span>
              </button>
            )}
          </div>

          <button
            type="button"
            className={`claude-send-btn ${isSendActive ? 'active' : ''}`}
            onClick={handleSubmit}
            disabled={!isSendActive}
            aria-label="Submit lease text or question"
            title="Submit"
          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Suggestions Grid Below Card (shown when no document active) */}
      {!currentDoc && (
        <div className="claude-suggestions-container" style={{ marginTop: '1.25rem' }}>
          <div className="suggestions-grid">
            <button
              type="button"
              className="suggestion-pill"
              onClick={handleSampleClick}
              disabled={isProcessing}
            >
              <ShieldAlert size={14} className="pill-icon text-terracotta" aria-hidden="true" />
              <span>Audit Security Deposit & Move-Out Deductions</span>
            </button>

            <button
              type="button"
              className="suggestion-pill"
              onClick={handleSampleClick}
              disabled={isProcessing}
            >
              <Clock size={14} className="pill-icon text-amber" aria-hidden="true" />
              <span>Verify Landlord 24-Hour Notice Rights</span>
            </button>

            <button
              type="button"
              className="suggestion-pill"
              onClick={handleSampleClick}
              disabled={isProcessing}
            >
              <RefreshCw size={14} className="pill-icon text-blue" aria-hidden="true" />
              <span>Detect Auto-Renewal & Liquidated Damages</span>
            </button>

            <button
              type="button"
              className="suggestion-pill"
              onClick={handleSampleClick}
              disabled={isProcessing}
            >
              <Scale size={14} className="pill-icon text-emerald" aria-hidden="true" />
              <span>Generate Attorney Consultation Checklist</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ClaudeInputBar;
