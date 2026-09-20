import React, { useState } from 'react';
import { GitCompare, ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Sparkles } from 'lucide-react';
import { InlineDisclaimer } from './LegalDisclaimer';
import { compareLeaseDocuments } from '../api/client';

const SAMPLE_REVISED_LEASE = `STANDARD RESIDENTIAL LEASE AGREEMENT (AMENDED DRAFT)

This Agreement is entered into on June 5, 2026, between Apex Properties LLC ("Landlord") and Jane Doe ("Tenant") for the premises located at 124 Elm Street, Apt 3B, Springfield.

SECTION 1: TERM
The initial term shall commence on July 1, 2026, and expire on June 30, 2027 ("Lease Term").

SECTION 2: RENT AND PAYMENT TERMS
Monthly rent is $2,100.00, due on the first calendar day of each month. A five (5) day grace period applies. If received after the 5th, a single flat late fee of $50.00 shall apply.

SECTION 3: SECURITY DEPOSIT
Tenant shall deposit $2,100.00 upon execution. The entire deposit is 100% refundable within 21 days following move-out, subject only to documented damages exceeding normal wear and tear.

SECTION 4: AUTOMATIC RENEWAL
Upon expiration of the initial term, this Agreement shall convert to a month-to-month tenancy unless either party provides thirty (30) days written notice. Rent increases shall not exceed 5% annually.

SECTION 5: LANDLORD RIGHT OF ENTRY
Landlord shall provide at least twenty-four (24) hours advance written notice prior to entering for non-emergency inspections or showings.

SECTION 6: MAINTENANCE AND REPAIRS
Landlord is responsible for all HVAC, electrical, and plumbing repairs. Tenant is responsible only for tenant-caused misuse and routine housekeeping.

SECTION 7: TERMINATION AND DEFAULT
Either party may terminate upon thirty (30) days written notice in the event of an uncured material default.`;

export function ComparisonView({ originalText, originalFilename }) {
  const [revisedText, setRevisedText] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    if (!revisedText.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await compareLeaseDocuments(
        originalText,
        revisedText.trim(),
        originalFilename || 'original_lease.txt',
        'revised_countersigned_lease.txt'
      );
      setComparisonResult(result);
    } catch (err) {
      setError(err.message || 'Comparison failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleRevised = () => {
    setRevisedText(SAMPLE_REVISED_LEASE);
  };

  const getImpactBadge = (impact) => {
    switch (impact) {
      case 'MORE_FAVORABLE':
        return {
          label: 'Tenant Favorable',
          className: 'impact-good',
          icon: ArrowUpRight,
        };
      case 'LESS_FAVORABLE':
        return {
          label: 'Tenant Unfavorable',
          className: 'impact-bad',
          icon: ArrowDownRight,
        };
      default:
        return {
          label: 'Neutral Modification',
          className: 'impact-neutral',
          icon: Minus,
        };
    }
  };

  return (
    <div className="comparison-container" aria-labelledby="comparison-heading">
      <div className="view-intro">
        <h3 id="comparison-heading" className="view-title">Two-Document Lease Comparison</h3>
        <p className="view-subtitle">
          Compare your original lease draft against a landlord's revised draft or renewal offer to identify exactly what changed and whether terms improved or worsened.
        </p>
      </div>

      {!comparisonResult && (
        <div className="comparison-setup-card">
          <div className="setup-header">
            <h4>Paste Revised Lease Draft</h4>
            <button
              type="button"
              className="btn btn-sample btn-sm"
              onClick={handleLoadSampleRevised}
              disabled={isLoading}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>Load Sample Landlord Concession Draft</span>
            </button>
          </div>

          <label htmlFor="revised-lease-input" className="sr-only">
            Revised lease text
          </label>
          <textarea
            id="revised-lease-input"
            className="comparison-textarea"
            rows={9}
            placeholder="Paste the revised lease or amendment text here..."
            value={revisedText}
            onChange={(e) => setRevisedText(e.target.value)}
            disabled={isLoading}
          />

          <div className="setup-footer">
            <button
              type="button"
              className="btn btn-primary btn-compare-action"
              onClick={handleCompare}
              disabled={isLoading || revisedText.trim().length < 10}
            >
              <GitCompare size={17} aria-hidden="true" />
              <span>{isLoading ? 'Comparing drafts...' : 'Run Comparative Analysis'}</span>
            </button>
          </div>

          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      )}

      {isLoading && (
        <div className="qa-thinking-card" role="status" aria-live="polite">
          <div className="pulse-indicator" aria-hidden="true"></div>
          <span>Comparing clauses between both drafts and evaluating tenant impacts...</span>
        </div>
      )}

      {comparisonResult && (
        <div className="comparison-results">
          <div className="comparison-summary-card">
            <h4>Comparison Overview</h4>
            <p className="summary-overview">{comparisonResult.overview}</p>
            <div className="net-assessment-box">
              <strong>Net Assessment for Tenant:</strong> {comparisonResult.net_assessment}
            </div>
          </div>

          <div className="differences-list">
            <h4>Detailed Clause Revisions</h4>
            {comparisonResult.differences.map((diff, idx) => {
              const impact = getImpactBadge(diff.impact_on_tenant);
              const ImpactIcon = impact.icon;
              return (
                <article key={idx} className="diff-card">
                  <div className="diff-header">
                    <span className="diff-section-tag">{diff.section}</span>
                    <span className={`diff-impact-pill ${impact.className}`}>
                      <ImpactIcon size={14} aria-hidden="true" /> {impact.label}
                    </span>
                    <span className="diff-type-badge">{diff.change_type}</span>
                  </div>

                  <p className="diff-analysis">
                    <strong>Analysis:</strong> {diff.analysis}
                  </p>

                  <div className="diff-wording-grid">
                    {diff.original_text && (
                      <div className="wording-col original-wording">
                        <span className="wording-label">Original Version:</span>
                        <p>"{diff.original_text}"</p>
                      </div>
                    )}
                    {diff.revised_text && (
                      <div className="wording-col revised-wording">
                        <span className="wording-label">Revised Version:</span>
                        <p>"{diff.revised_text}"</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <InlineDisclaimer text={comparisonResult.disclaimer} />
        </div>
      )}
    </div>
  );
}
