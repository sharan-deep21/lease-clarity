import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskFlagsView } from '../components/RiskFlagsView';

describe('RiskFlagsView Component', () => {
  it('renders null when riskData is null', () => {
    const { container } = render(<RiskFlagsView riskData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders risk score badge and red flag cards', () => {
    const mockRiskData = {
      overall_risk_score: 'HIGH_RISK',
      flag_count: 1,
      red_flags: [
        {
          category: 'Security Deposit',
          severity: 'HIGH',
          clause_title: 'Non-Refundable Fee',
          quoted_clause: '$1,000 shall be retained as non-refundable fee.',
          risk_explanation: 'Landlords cannot withhold deposit as non-refundable fee.',
          tenant_recommendation: 'Request removal of non-refundable clause.',
        },
      ],
      disclaimer: 'Educational purposes only.',
    };

    render(<RiskFlagsView riskData={mockRiskData} />);
    expect(screen.getByText(/High Risk \/ Unfavorable Terms/i)).toBeInTheDocument();
    expect(screen.getByText('Non-Refundable Fee')).toBeInTheDocument();
    expect(screen.getByText(/Request removal of non-refundable clause\./i)).toBeInTheDocument();
  });
});
