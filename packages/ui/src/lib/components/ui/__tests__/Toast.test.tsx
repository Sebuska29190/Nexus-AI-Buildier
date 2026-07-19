import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';

// Helper component to trigger toasts
function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>Show Success</button>
      <button onClick={() => showToast('Error message', 'error')}>Show Error</button>
      <button onClick={() => showToast('Info message', 'info')}>Show Info</button>
      <button onClick={() => showToast('Warning message', 'warning')}>Show Warning</button>
    </div>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider', () => {
  it('renders children', () => {
    renderWithProvider(<div>Child Content</div>);
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('shows a success toast when triggered', () => {
    renderWithProvider(<ToastTrigger />);
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows an error toast when triggered', () => {
    renderWithProvider(<ToastTrigger />);
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('shows an info toast when triggered', () => {
    renderWithProvider(<ToastTrigger />);
    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('shows a warning toast when triggered', () => {
    renderWithProvider(<ToastTrigger />);
    fireEvent.click(screen.getByText('Show Warning'));
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('removes toast after 3 seconds', () => {
    renderWithProvider(<ToastTrigger />);
    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info message')).toBeInTheDocument();

    // Advance time past the 3000ms auto-dismiss
    act(() => {
      vi.advanceTimersByTime(3100);
    });

    // The toast should now be removed
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
  });

  it('dismisses toast when close button is clicked', () => {
    renderWithProvider(<ToastTrigger />);
    fireEvent.click(screen.getByText('Show Info'));

    const dismissBtn = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissBtn);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
  });

  it('has role="log" for notifications container', () => {
    renderWithProvider(<ToastTrigger />);
    const log = screen.getByRole('log');
    expect(log).toBeInTheDocument();
    expect(log).toHaveAttribute('aria-live', 'polite');
  });
});
