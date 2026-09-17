import React from 'react';
import { DollarSign, Shield, Calendar, LogOut, Wrench, Home } from 'lucide-react';
import { InlineDisclaimer } from './LegalDisclaimer';

export function SummaryView({ summary }) {
  if (!summary) return null;

  const sections = [
    {
      id: 'rent',
      title: '1. Rent & Payments',
      icon: DollarSign,
      content: summary.rent,
      color: 'blue',
    },
    {
      id: 'deposit',
      title: '2. Security Deposit',
      icon: Shield,
      content: summary.deposit,
      color: 'emerald',
    },
    {
      id: 'term',
      title: '3. Term & Renewal',
      icon: Calendar,
      content: summary.term,
      color: 'indigo',
    },
    {
      id: 'termination',
      title: '4. Termination & Eviction',
      icon: LogOut,
      content: summary.termination,
      color: 'amber',
    },
    {
      id: 'maintenance',
      title: '5. Maintenance & Repairs',
      icon: Wrench,
      content: summary.maintenance,
      color: 'cyan',
    },
    {
      id: 'other',
      title: '6. House Rules & Other',
      icon: Home,
      content: summary.other,
      color: 'purple',
    },
  ];

  return (
    <div className="summary-container" aria-labelledby="summary-heading">
      <div className="view-intro">
        <h3 id="summary-heading" className="view-title">Plain-Language Lease Summary</h3>
        <p className="view-subtitle">
          Key terms translated from dense contract language into clear, everyday English across 6 critical tenant areas.
        </p>
      </div>

      <div className="summary-grid">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <article key={sec.id} className={`summary-card card-${sec.color}`} aria-labelledby={`card-${sec.id}`}>
              <div className="card-header">
                <div className="icon-badge" aria-hidden="true">
                  <Icon size={20} />
                </div>
                <h4 id={`card-${sec.id}`} className="card-title">{sec.title}</h4>
              </div>
              <p className="card-content">{sec.content}</p>
            </article>
          );
        })}
      </div>

      <InlineDisclaimer text={summary.disclaimer} />
    </div>
  );
}
