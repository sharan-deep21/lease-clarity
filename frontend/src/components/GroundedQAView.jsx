import React, { useState } from 'react';
import { Send, HelpCircle, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { InlineDisclaimer } from './LegalDisclaimer';
import { askLeaseQuestion } from '../api/client';

const SUGGESTED_QUESTIONS = [
  'What is the late fee and grace period for rent?',
  'Is my security deposit fully refundable?',
  'Can the landlord enter my apartment without prior notice?',
  'Who is responsible for HVAC and plumbing repairs?',
  'What happens if I need to terminate the lease early?',
  'Are pets allowed in the building?',
];

export function GroundedQAView({ documentText }) {
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const currentQuestion = question.trim();
    setIsLoading(true);
    setError(null);

    try {
      const response = await askLeaseQuestion(documentText, currentQuestion);
      setQaHistory((prev) => [response, ...prev]);
      setQuestion('');
    } catch (err) {
      setError(err.message || 'Failed to obtain answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggested = (q) => {
    setQuestion(q);
  };

  return (
    <div className="qa-container" aria-labelledby="qa-heading">
      <div className="view-intro">
        <h3 id="qa-heading" className="view-title">Grounded Lease Q&A</h3>
        <p className="view-subtitle">
          Ask any specific question about your lease. Every answer strictly cites relevant clauses. If a topic is not in the lease, the system will not guess—it will direct you to an attorney.
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="suggested-block">
        <span className="suggested-label">
          <Sparkles size={14} aria-hidden="true" /> Common tenant questions:
        </span>
        <div className="suggested-chips">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-btn"
              onClick={() => handleSelectSuggested(q)}
              disabled={isLoading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Question Form */}
      <form onSubmit={handleSubmit} className="qa-form">
        <label htmlFor="user-qa-input" className="form-label">
          Your Question About the Agreement:
        </label>
        <div className="input-group">
          <input
            id="user-qa-input"
            type="text"
            className="text-input"
            placeholder="e.g. Can the landlord enter my unit without giving 24 hours notice?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            required
            aria-required="true"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !question.trim()}
            aria-label="Submit lease question"
          >
            <Send size={18} aria-hidden="true" />
            <span>{isLoading ? 'Searching...' : 'Ask'}</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="qa-error-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="qa-thinking-card" role="status" aria-live="polite">
          <div className="pulse-indicator" aria-hidden="true"></div>
          <span>Analyzing lease clauses and verifying exact citations...</span>
        </div>
      )}

      {/* Q&A History */}
      <div className="qa-history" role="feed" aria-label="Question and answer feed">
        {qaHistory.length === 0 && !isLoading && (
          <div className="empty-qa-placeholder">
            <HelpCircle size={40} className="empty-icon" aria-hidden="true" />
            <p>No questions asked yet. Choose a suggested question above or type your own.</p>
          </div>
        )}

        {qaHistory.map((item, idx) => (
          <article key={idx} className="qa-card" aria-labelledby={`qa-q-${idx}`}>
            <div className="qa-question-row">
              <span className="q-label">Q:</span>
              <h4 id={`qa-q-${idx}`} className="qa-question-text">{item.question}</h4>
            </div>

            <div className="qa-answer-row">
              <span className="a-label">A:</span>
              <div className="qa-answer-body">
                <p className={`qa-answer-text ${!item.is_addressed_in_document ? 'unaddressed-warning' : ''}`}>
                  {item.answer}
                </p>

                {item.citations && item.citations.length > 0 && (
                  <div className="citations-wrapper">
                    <span className="citation-title">
                      <BookOpen size={14} aria-hidden="true" /> Verified Clause Citations:
                    </span>
                    <ul className="citation-list">
                      {item.citations.map((cite, cIdx) => (
                        <li key={cIdx} className="citation-pill">
                          {cite}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <InlineDisclaimer text={item.disclaimer} />
          </article>
        ))}
      </div>
    </div>
  );
}
