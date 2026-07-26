import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiKeysPage from '../ApiKeysPage';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      providers: [
        { id: 'openai', name: 'OpenAI', hasKey: true, enabled: true, models: 3 },
        { id: 'anthropic', name: 'Anthropic', hasKey: false, enabled: true, models: 2 },
      ],
    }),
  });
});

describe('ApiKeysPage', () => {
  it('renders the page title and provider count', async () => {
    render(<ApiKeysPage />);
    expect(screen.getByText('API Providers')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/1\/2 skonfigurowanych/)).toBeInTheDocument();
    });
  });

  it('displays providers with their status', async () => {
    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('Configured')).toBeInTheDocument();
      expect(screen.getByText('No key')).toBeInTheDocument();
    });
  });

  it('shows add provider button', async () => {
    render(<ApiKeysPage />);
    expect(screen.getByText(/Dodaj Custom Provider/)).toBeInTheDocument();
  });

  it('opens add provider form when clicking the button', async () => {
    const user = userEvent.setup();
    render(<ApiKeysPage />);
    await user.click(screen.getByText(/Dodaj Custom Provider/));
    expect(screen.getByText('Utwórz Provider')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    render(<ApiKeysPage />);
    expect(screen.getByText('Ładowanie providerów...')).toBeInTheDocument();
  });

  it('shows delete buttons for configured providers', async () => {
    render(<ApiKeysPage />);
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Usuń konfigurację');
      expect(deleteButtons.length).toBe(1); // Only openai has a key
    });
  });

  it('opens confirm dialog when delete is clicked', async () => {
    const user = userEvent.setup();
    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByTitle('Usuń konfigurację')).toBeInTheDocument();
    });
    await user.click(screen.getByTitle('Usuń konfigurację'));
    expect(screen.getByText('Usuń Provider')).toBeInTheDocument();
    expect(screen.getByText('Usuń')).toBeInTheDocument();
  });

  it('displays empty state when no providers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [] }),
    });
    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.queryByText('OpenAI')).not.toBeInTheDocument();
      expect(screen.queryByText('Configured')).not.toBeInTheDocument();
      expect(screen.queryByText('No key')).not.toBeInTheDocument();
    });
  });

  it('shows test and delete buttons for configured providers', async () => {
    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByTitle('Test połączenia')).toBeInTheDocument();
      expect(screen.getByTitle('Usuń konfigurację')).toBeInTheDocument();
    });
  });
});
