import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeaseInputBar } from '../components/LeaseInputBar';

describe('FileUpload Validation & LeaseInputBar', () => {
  it('renders textarea and upload button', () => {
    render(<LeaseInputBar onFileUpload={() => {}} onTextSubmit={() => {}} />);
    expect(screen.getByPlaceholderText(/Paste lease text here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload New/i })).toBeInTheDocument();
  });

  it('triggers alert on invalid file type selection', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = render(<LeaseInputBar onFileUpload={() => {}} onTextSubmit={() => {}} />);

    const input = container.querySelector('input[type="file"]');
    const invalidFile = new File(['content'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [invalidFile] } });
    expect(alertSpy).toHaveBeenCalledWith('Please attach a PDF (.pdf) or Plain Text (.txt) rental agreement.');
    alertSpy.mockRestore();
  });
});
