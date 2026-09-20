import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccessibleAlert } from '../components/AccessibleAlert';

describe('AccessibleAlert Component', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<AccessibleAlert message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders alert message with role="alert" when message is provided', () => {
    render(<AccessibleAlert message="File size exceeds limit." />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('File size exceeds limit.')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = vi.fn();
    render(<AccessibleAlert message="Upload failed." onDismiss={handleDismiss} />);
    const dismissBtn = screen.getByRole('button', { name: /dismiss error message/i });
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
