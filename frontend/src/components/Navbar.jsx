import React from 'react';
import { RotateCcw, Sun, Moon, ArrowRight } from 'lucide-react';

export function Navbar({ onResetSession, hasDocument, onTrySample }) {
  return (
    <header className="navbar-wrapper">
      <nav className="pill-navbar" aria-label="Main Navigation">
        {/* Brand Lockup with Dual-Color Pulsing Dot */}
        <a href="#main-content" className="nav-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-text">LeaseClarity</span>
        </a>

        {/* Feature Navigation Links */}
        <div className="nav-links">
          <a href="#main-content" className="nav-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Overview</a>
          <span className="nav-tag">AI LEGAL ACCESS</span>
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          {hasDocument && (
            <button
              type="button"
              className="nav-cta-pill"
              onClick={onResetSession}
              aria-label="Analyze a new lease agreement"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>New Lease</span>
              <ArrowRight size={12} className="cta-arrow" aria-hidden="true" />
            </button>
          )}

          {/* Try Button with Right-Facing Arrow */}
          <button
            type="button"
            className="nav-try-pill"
            onClick={onTrySample}
            aria-label="Try LeaseClarity Sample Lease"
            title="Try Sample Lease Agreement"
          >
            <span>Try</span>
            <ArrowRight size={13} className="try-arrow" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </header>
  );
}

