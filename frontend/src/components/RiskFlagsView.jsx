import React from 'react';
import { AlertTriangle, Quote, CheckCircle2, ShieldCheck, Compass } from 'lucide-react';
import { InlineDisclaimer } from './LegalDisclaimer';

export function RiskFlagsView({ riskData }) {
  if (!riskData) return null;

  const { overall_risk_score, red_flags, flag_count, disclaimer } = riskData;

  const getScoreBadge = (score) => {
    switch (score) {
      case 'HIGH_RISK':
        return {
          label: 'High Risk / Unfavorable Terms',
          className: 'score-high',
          icon: AlertTriangle,
          desc: 'This lease contains multiple terms that severely limit tenant rights, mandate unusual fees, or allow one-sided landlord actions.',
        };
      case 'MODERATE_RISK':
        return {
          label: 'Moderate Risk / Caution Advised',
          className: 'score-medium',
          icon: Compass,
          desc: 'This lease has a few terms that warrant negotiation or formal clarification prior to signing.',
        };
      case 'LOW_RISK':
      default:
        return {
          label: 'Low Risk / Standard Terms',
          className: 'score-low',
          icon: ShieldCheck,
          desc: 'This lease appears balanced and standard with no aggressive or unusual tenant-unfavorable covenants.',
        };
    }
  };

  const scoreInfo = getScoreBadge(overall_risk_score);
  const ScoreIcon = scoreInfo.icon;

  return (
    <div className="risk-container" aria-labelledby="risk-heading">
      <div className="view-intro">
        <h3 id="risk-heading" className="view-title">Risk & Red-Flag Audit</h3>
        <p className="view-subtitle">
          Uncovering hidden traps, unusual covenants, and terms that place disproportionate burdens on the renter.
        </p>
      </div>

      {/* Overall Risk Score Card */}
      <div className={`risk-overview-banner ${scoreInfo.className}`}>
        <div className="overview-icon-col" aria-hidden="true">
          <ScoreIcon size={36} />
        </div>
        <div className="overview-text-col">
          <div className="overview-topline">
            <span className="overview-badge">{scoreInfo.label}</span>
            <span className="overview-count">
              {flag_count} {flag_count === 1 ? 'Red Flag' : 'Red Flags'} Detected
            </span>
          </div>
          <p className="overview-desc">{scoreInfo.desc}</p>
        </div>
      </div>

      {/* Zero Flags State */}
      {flag_count === 0 && (
        <div className="zero-flags-card" role="status">
          <CheckCircle2 size={32} style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
          <h4>No Tenant-Unfavorable Traps Detected</h4>
          <p>The analyzed clauses align with standard residential lease practices.</p>
        </div>
      )}

      {/* Red Flag Cards */}
      {flag_count > 0 && (
        <div className="flags-list" role="list" aria-label="Detected lease red flags">
          {red_flags.map((flag, index) => (
            <article
              key={index}
              role="listitem"
              className={`flag-card severity-${flag.severity.toLowerCase()}`}
              aria-labelledby={`flag-title-${index}`}
            >
              <div className="flag-header">
                <div className="flag-meta">
                  <span className={`severity-pill pill-${flag.severity.toLowerCase()}`}>
                    {flag.severity} RISK
                  </span>
                  <span className="category-pill">{flag.category}</span>
                </div>
                <h4 id={`flag-title-${index}`} className="flag-title">{flag.clause_title}</h4>
              </div>

              <div className="flag-body">
                <div className="flag-explanation">
                  <strong>Why this matters:</strong> {flag.risk_explanation}
                </div>

                <blockquote className="flag-quote" aria-label="Quoted clause from lease">
                  <Quote size={18} className="quote-icon" aria-hidden="true" />
                  <p>"{flag.quoted_clause}"</p>
                </blockquote>

                <div className="flag-recommendation">
                  <strong>Recommended tenant action:</strong> {flag.tenant_recommendation}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <InlineDisclaimer text={disclaimer} />
    </div>
  );
}
