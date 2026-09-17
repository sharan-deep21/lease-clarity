import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, FileCode, CheckCircle2, Sparkles } from 'lucide-react';

const SAMPLE_LEASE_TEXT = `STANDARD RESIDENTIAL LEASE AGREEMENT

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

export function FileUpload({ onFileUpload, onTextSubmit, isProcessing }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (pastedText.trim().length >= 10) {
      onTextSubmit(pastedText.trim(), 'pasted_lease.txt');
    }
  };

  const handleLoadSample = () => {
    onTextSubmit(SAMPLE_LEASE_TEXT, 'sample_springfield_lease.txt');
  };

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <div className="upload-header">
        <h2 id="upload-heading" className="section-title">
          Understand Your Lease Before You Sign
        </h2>
        <p className="section-desc">
          Upload your residential lease agreement as a PDF or text file (max 5MB), or paste the text directly. All processing occurs in memory without permanent storage.
        </p>
      </div>

      <div className="sample-quick-trigger">
        <button
          type="button"
          className="btn btn-sample"
          onClick={handleLoadSample}
          disabled={isProcessing}
          aria-label="Load pre-configured sample lease with typical tenant red flags"
        >
          <Sparkles size={16} aria-hidden="true" />
          <span>Try with Sample Lease (Quick Demo)</span>
        </button>
      </div>

      {/* Accessible Tab Switcher */}
      <div className="tab-group" role="tablist" aria-label="Lease input methods">
        <button
          type="button"
          role="tab"
          id="tab-upload"
          aria-selected={activeTab === 'upload'}
          aria-controls="panel-upload"
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <UploadCloud size={18} aria-hidden="true" />
          <span>Upload File (PDF / TXT)</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-paste"
          aria-selected={activeTab === 'paste'}
          aria-controls="panel-paste"
          className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
          onClick={() => setActiveTab('paste')}
        >
          <FileText size={18} aria-hidden="true" />
          <span>Paste Text Directly</span>
        </button>
      </div>

      {/* Tab Panel: File Upload */}
      {activeTab === 'upload' && (
        <div
          id="panel-upload"
          role="tabpanel"
          aria-labelledby="tab-upload"
          className="tab-panel"
        >
          <div
            className={`dropzone ${isDragOver ? 'dragover' : ''} ${isProcessing ? 'disabled' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud className="dropzone-icon" size={48} aria-hidden="true" />
            <p className="dropzone-title">Drag & drop your lease document here</p>
            <p className="dropzone-sub">Supports PDF (.pdf) and Plain Text (.txt) up to 5 MB</p>

            <div className="dropzone-divider">
              <span>or</span>
            </div>

            <label htmlFor="lease-file-input" className="btn btn-primary cursor-pointer">
              <span>Browse Files on Computer</span>
              <input
                id="lease-file-input"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf"
                className="visually-hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
                aria-describedby="file-upload-help"
              />
            </label>
            <p id="file-upload-help" className="sr-only">
              Maximum file size 5 megabytes. Only PDF and plain text documents are accepted.
            </p>
          </div>
        </div>
      )}

      {/* Tab Panel: Paste Text */}
      {activeTab === 'paste' && (
        <div
          id="panel-paste"
          role="tabpanel"
          aria-labelledby="tab-paste"
          className="tab-panel"
        >
          <form onSubmit={handlePasteSubmit} className="paste-form">
            <label htmlFor="lease-paste-input" className="form-label">
              Paste Lease Agreement Text:
            </label>
            <textarea
              id="lease-paste-input"
              className="text-area-input"
              rows={12}
              placeholder="Paste the full text of your lease agreement here (clauses, terms, rules)..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              disabled={isProcessing}
              required
              aria-required="true"
            />
            <div className="form-footer">
              <span className="char-count" aria-live="polite">
                {pastedText.length} characters
              </span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isProcessing || pastedText.trim().length < 10}
              >
                <span>Analyze Pasted Lease</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
