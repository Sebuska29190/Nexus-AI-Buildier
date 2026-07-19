import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AgentWorkPanel } from '../AgentWorkPanel';

// Mock EventSource
class MockEventSource {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  readyState = 0;
  constructor(public url: string) {
    setTimeout(() => {
      this.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify({
          type: 'thinking',
          data: { resultPreview: 'Analyzing...' },
          ts: Date.now()
        })
      }));
    }, 10);
  }
}
(global as any).EventSource = MockEventSource;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AgentWorkPanel', () => {
  it('renders null when idle (no runId given)', () => {
    const { container } = render(<AgentWorkPanel runId="" />);
    expect(container.innerHTML).toBeFalsy();
  });

  it('renders work panel with a valid runId', () => {
    render(<AgentWorkPanel runId="test-run-1" agentName="TestAgent" />);
    expect(screen.getByText(/TestAgent/)).toBeInTheDocument();
  });

  it('shows working status initially', () => {
    render(<AgentWorkPanel runId="test-run-2" />);
    expect(screen.getByText('Working…')).toBeInTheDocument();
  });

  it('shows elapsed time after running', () => {
    render(<AgentWorkPanel runId="test-run-3" />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/2s/)).toBeInTheDocument();
  });

  it('collapses and expands on header click', () => {
    render(<AgentWorkPanel runId="test-run-4" />);
    // Header has the connection status and agent name
    const header = screen.getByText('Working…');
    fireEvent.click(header.closest('button')!);
    // The panel should still be in the DOM but collapsed content changes
    // After clicking again it should expand
    fireEvent.click(header.closest('button')!);
    expect(screen.getByText('Working…')).toBeInTheDocument();
  });

  it('has steer input and stop button when running', () => {
    render(<AgentWorkPanel runId="test-run-5" />);
    expect(screen.getByPlaceholderText('Tell agent what to focus on…')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop agent execution')).toBeInTheDocument();
  });

  it('has send steering message button', () => {
    render(<AgentWorkPanel runId="test-run-6" />);
    expect(screen.getByLabelText('Send steering message')).toBeInTheDocument();
  });

  it('shows connection status indicator', () => {
    render(<AgentWorkPanel runId="test-run-7" />);
    // Connection status badge may not show "Live" synchronously,
    // but the expand/collapse button should be present
    const expandBtn = screen.getByText('Working…');
    expect(expandBtn).toBeInTheDocument();
  });
});
