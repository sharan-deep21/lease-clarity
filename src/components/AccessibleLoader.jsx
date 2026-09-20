import React from 'react';
import { Loader2 } from 'lucide-react';

export function AccessibleLoader({ message = 'Analyzing document...' }) {
  return (
    <div
      className="loader-container"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Loader2 className="loader-spinner" aria-hidden="true" size={32} />
      <span className="loader-text">{message}</span>
    </div>
  );
}
