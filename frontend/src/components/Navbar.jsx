import React from 'react';
import { Scale, RotateCcw } from 'lucide-react';

export function Navbar({ onResetSession, hasDocument }) {
  return (
    <header className="site-header">
      <div className="header-container">
        <div className="brand-lockup">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="brand-title">LeaseClarity</h1>
            <p className="brand-subtitle">AI Rental Agreement Assistant for First-Time Tenants</p>
          </div>
        </div>

        <div className="header-actions">
          <span className="vertical-pill">AI for Legal Access</span>
          {hasDocument && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onResetSession}
              aria-label="Upload another lease agreement and clear active session"
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span>New Lease</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
