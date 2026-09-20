import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryView } from '../components/SummaryView';

describe('SummaryView Component', () => {
  it('renders null when summary is null', () => {
    const { container } = render(<SummaryView summary={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all summary sections when data is provided', () => {
    const mockSummary = {
      rent: 'Rent is $2,100 per month due on the 1st.',
      deposit: 'Security deposit is $2,100 refundable within 30 days.',
      term: '12-month fixed lease from July 1 to June 30.',
      termination: '30 days written notice required.',
      maintenance: 'Landlord handles plumbing and structural maintenance.',
      other: 'No pets permitted without prior approval.',
    };

    render(<SummaryView summary={mockSummary} />);
    expect(screen.getByText('1. Rent & Payments')).toBeInTheDocument();
    expect(screen.getByText('Rent is $2,100 per month due on the 1st.')).toBeInTheDocument();
    expect(screen.getByText('2. Security Deposit')).toBeInTheDocument();
    expect(screen.getByText('3. Term & Renewal')).toBeInTheDocument();
  });
});
