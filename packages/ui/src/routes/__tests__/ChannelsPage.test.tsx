import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ChannelsPage } from '../ChannelsPage';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ channels: [{ id: 'telegram', config: { token: 'abc', chatId: '123' }, connected: true }] }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ configs: { telegram: { token: 'abc', chatId: '123' } } }),
    });
});

describe('ChannelsPage', () => {
  it('renders the page title', () => {
    render(<ChannelsPage />);
    expect(screen.getByText('External Communication Pipelines')).toBeInTheDocument();
  });

  it('displays channel definitions', async () => {
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText('Telegram Gateway')).toBeInTheDocument();
      expect(screen.getByText('Discord Bridge')).toBeInTheDocument();
      expect(screen.getByText('Ntfy Push Alerts')).toBeInTheDocument();
      expect(screen.getByText('Slack Integration')).toBeInTheDocument();
    });
  });

  it('shows connected status for telegram', async () => {
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('shows refresh button', () => {
    render(<ChannelsPage />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('shows channel counts', async () => {
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText(/1 connected/)).toBeInTheDocument();
    });
  });

  it('shows loading indicator initially', () => {
    render(<ChannelsPage />);
    expect(screen.getByText('Loading channels...')).toBeInTheDocument();
  });
});
