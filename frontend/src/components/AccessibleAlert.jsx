import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export function AccessibleAlert({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      className="alert-banner"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="alert-content">
        <AlertCircle className="alert-icon" aria-hidden="true" size={20} />
        <span className="alert-message">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="alert-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss error message"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
