import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        { id: 'openai', name: 'OpenAI', hasKey: true, enabled: true, models: 3, status: 'valid' },
        { id: 'anthropic', name: 'Anthropic', hasKey: false, enabled: true, models: 2 },
      ],
    }),
  });
});

describe('ApiKeysPage', () => {
  it('renders the page title and provider count', async () => {
    render(<ApiKeysPage />);
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/1\/2 providers configured/)).toBeInTheDocument();
    });
  });

  it('displays providers with their status', async () => {
    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('✓ Valid')).toBeInTheDocument();
      expect(screen.getByText('No key')).toBeInTheDocument();
    });
  });

  it('shows "Add Key" button', () => {
    render(<ApiKeysPage />);
    expect(screen.getByText('Add Key')).toBeInTheDocument();
  });

  it('opens add key form when clicking Add Key', async () => {
    render(<ApiKeysPage />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Add Key'));
    expect(screen.getByText('Add & Encrypt')).toBeInTheDocument();
  });

  it('disables add button when key is empty', async () => {
    render(<ApiKeysPage />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Add Key'));
    const addBtn = screen.getByText('Add & Encrypt');
    expect(addBtn).toBeDisabled();
  });

  it('shows loading spinner initially', () => {
    render(<ApiKeysPage />);
    expect(screen.getByText('Loading providers...')).toBeInTheDocument();
  });

  it('shows delete buttons for configured providers', async () => {
    render(<ApiKeysPage />);
    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText('Delete API key');
      expect(deleteButtons.length).toBe(1); // Only openai has a key
    });
  });

  it('opens confirm dialog when delete is clicked', async () => {
    render(<ApiKeysPage />);
    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByLabelText('Delete API key')).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText('Delete API key'));
    expect(screen.getByText('Remove API Key')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('displays empty state when no providers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [] }),
    });
    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText('No providers found. Start the server to detect providers.')).toBeInTheDocument();
    });
  });
});
