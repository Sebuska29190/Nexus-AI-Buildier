import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../SettingsPage';
import * as apiModule from '../../lib/api';

// Mock api module
vi.mock('../../lib/api', () => ({
  api: {
    models: vi.fn().mockResolvedValue([
      { id: 'deepseek/deepseek-chat', owned_by: 'deepseek' },
      { id: 'gpt-4', owned_by: 'openai' },
    ]),
    health: vi.fn(),
    sessions: vi.fn(),
    skills: vi.fn(),
    agents: vi.fn(),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ providers: [{ id: 'openai', name: 'OpenAI', hasKey: true, models: [1, 2, 3] }] }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        settings: {
          appName: 'AgentForge', language: 'en', timezone: 'Europe/Warsaw',
          animations: true, port: 4123, host: '127.0.0.1',
          authEnabled: false, defaultModel: 'deepseek/deepseek-chat',
          autoApprove: false, thinkingMode: true,
        },
      }),
    });
});

describe('SettingsPage', () => {
  it('renders settings page with tabs', async () => {
    render(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Models & Providers')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
    });
  });

  it('shows provider and model count', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText(/1 providers/)).toBeInTheDocument();
      expect(screen.getByText(/2 models available/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('has save and reset buttons', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });
  });

  it('displays the save error when save fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    // Re-mock for the save endpoint
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('shows General tab content by default', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Application')).toBeInTheDocument();
      expect(screen.getByText('Server')).toBeInTheDocument();
    });
  });

  it('switches to Security tab', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Security'));
    expect(screen.getByText('Authentication')).toBeInTheDocument();
  });
});
