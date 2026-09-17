import React, { useState } from 'react';
import { ClipboardList, Copy, Check, Printer, FileQuestion } from 'lucide-react';
import { InlineDisclaimer } from './LegalDisclaimer';

export function LawyerChecklistView({ checklistData, onGenerateChecklist, isLoading }) {
  const [copied, setCopied] = useState(false);

  if (!checklistData && !isLoading) {
    return (
      <div className="checklist-empty-state">
        <ClipboardList size={48} className="empty-icon" aria-hidden="true" />
        <h3>Prepare for Your Attorney Consultation</h3>
        <p>
          Transform detected red flags and ambiguous clauses into a focused, prioritized question sheet to take to a tenant lawyer or legal aid clinic.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGenerateChecklist}
          disabled={isLoading}
        >
          <span>Generate Attorney Checklist</span>
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="qa-thinking-card" role="status" aria-live="polite">
        <div className="pulse-indicator" aria-hidden="true"></div>
        <span>Synthesizing high-impact legal questions for your attorney consultation...</span>
      </div>
    );
  }

  const { questions, disclaimer } = checklistData;

  const handleCopy = () => {
    const textToCopy = questions
      .map(
        (q, idx) =>
          `${idx + 1}. [${q.priority} Priority] ${q.topic}\n` +
          `   Question: ${q.question}\n` +
          `   Referenced: ${q.referenced_clause}\n` +
          `   Reasoning: ${q.reasoning}\n`
      )
      .join('\n') + `\nDisclaimer: ${disclaimer}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="checklist-container printable-area" aria-labelledby="checklist-heading">
      <div className="view-intro">
        <div className="checklist-header-actions">
          <div>
            <h3 id="checklist-heading" className="view-title">Attorney Consultation Checklist</h3>
            <p className="view-subtitle">
              Bring these targeted questions to a licensed attorney or legal aid specialist to maximize consultation time.
            </p>
          </div>
          <div className="action-buttons-group">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
              aria-label="Copy checklist to clipboard"
            >
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              <span>{copied ? 'Copied!' : 'Copy Sheet'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              aria-label="Print attorney checklist"
            >
              <Printer size={16} aria-hidden="true" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>

      <div className="checklist-items" role="list" aria-label="Questions for attorney">
        {questions.map((item, idx) => (
          <article
            key={idx}
            role="listitem"
            className="checklist-card"
            aria-labelledby={`q-item-${idx}`}
          >
            <div className="checklist-item-header">
              <span className={`priority-badge priority-${item.priority.toLowerCase()}`}>
                {item.priority} PRIORITY
              </span>
              <span className="clause-ref-tag">
                <FileQuestion size={14} aria-hidden="true" /> {item.referenced_clause}
              </span>
            </div>

            <h4 id={`q-item-${idx}`} className="checklist-question-text">
              {idx + 1}. {item.question}
            </h4>

            <div className="checklist-reasoning">
              <strong>Context & Legal Rationale:</strong> {item.reasoning}
            </div>
          </article>
        ))}
      </div>

      <InlineDisclaimer text={disclaimer} />
    </div>
  );
}
