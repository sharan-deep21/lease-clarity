import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function LegalBanner() {
  return (
    <aside
      className="legal-banner"
      role="note"
      aria-label="Legal Assistance Disclaimer"
    >
      <div className="legal-banner-content">
        <ShieldAlert className="legal-banner-icon" aria-hidden="true" size={20} />
        <p>
          <strong>Legal Disclaimer:</strong> This assistant is an informational and educational tool designed to help tenants understand standard lease terminology. It does <strong>not</strong> provide legal advice, legal representation, or statutory determinations. Always consult a qualified, licensed attorney for professional legal counsel.
        </p>
      </div>
    </aside>
  );
}

export function InlineDisclaimer({ text }) {
  const disclaimerText = text || "This is informational only and not a substitute for professional legal advice.";
  return (
    <div className="inline-disclaimer" role="note">
      <span className="disclaimer-badge">Notice</span>
      <span className="disclaimer-text">{disclaimerText}</span>
    </div>
  );
}
