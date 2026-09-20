import React from 'react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

export function InteractiveLogo3D({ isCompact = false }) {
  return (
    <div className={`hero-branding ${isCompact ? 'is-compact' : ''}`}>
      <div className="brand-editorial-lockup">
        {!isCompact && (
          <div className="eyebrow-container" aria-hidden="true">
            <span className="eyebrow-line"></span>
            <span className="eyebrow-text">01 — WELCOME TO A NEW ERA OF LEASE INTELLIGENCE</span>
          </div>
        )}
        <h1 className="editorial-title">
          LeaseClarity<span className="accent-dot">.</span>
        </h1>
        {!isCompact && (
          <>
            <p className="editorial-tagline">
              AI-powered rental agreement intelligence for first-time tenants
            </p>

            <div className="trust-pills-row">
              <span className="trust-pill">
                <ShieldCheck size={13} aria-hidden="true" />
                <span>Grounded Citations</span>
              </span>
              <span className="trust-pill">
                <Lock size={13} aria-hidden="true" />
                <span>Zero Data Retention</span>
              </span>
              <span className="trust-pill">
                <Sparkles size={13} aria-hidden="true" />
                <span>Pro-Tenant Audit</span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export default InteractiveLogo3D;
