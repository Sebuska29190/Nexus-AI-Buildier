import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentConfigPage } from '../AgentConfigPage';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AgentConfigPage', () => {
  const sampleAgents = [
    { id: 'agent-1', name: 'Code Assistant', emoji: '💻', modelRef: 'gpt-4', strikes: 0, status: 'ready' },
    { id: 'agent-2', name: 'Debug Agent', emoji: '🐛', modelRef: 'claude-3', strikes: 2, status: 'degraded' },
  ];

  it('renders agent list when no agent is selected', () => {
    render(<AgentConfigPage agents={sampleAgents} />);
    expect(screen.getByText('🤖 Konfiguracja agentów')).toBeInTheDocument();
    expect(screen.getByText('Code Assistant')).toBeInTheDocument();
    expect(screen.getByText('Debug Agent')).toBeInTheDocument();
  });

  it('shows agent count', () => {
    render(<AgentConfigPage agents={sampleAgents} />);
    expect(screen.getByText('2 agentów')).toBeInTheDocument();
  });

  it('shows status badges correctly', () => {
    render(<AgentConfigPage agents={sampleAgents} />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('loads agent detail on click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        agent: { id: 'agent-1', name: 'Code Assistant', systemPrompt: 'You are a coding assistant.', modelRef: 'gpt-4', emoji: '💻', status: 'ready', skills: ['web_fetch'] },
      }),
    });

    const user = userEvent.setup();
    render(<AgentConfigPage agents={sampleAgents} />);
    await user.click(screen.getByText('Code Assistant'));
    
    await waitFor(() => {
      expect(screen.getByText('System Prompt')).toBeInTheDocument();
    });
  });

  it('shows loading state when fetching agent details', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // never resolves
    const user = userEvent.setup();
    render(<AgentConfigPage agents={sampleAgents} />);
    await user.click(screen.getByText('Code Assistant'));
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows display empty state with no agents', () => {
    render(<AgentConfigPage agents={[]} />);
    expect(screen.getByText('0 agentów')).toBeInTheDocument();
  });

  it('shows back button in detail view', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        agent: { id: 'agent-1', name: 'Code Assistant', systemPrompt: 'Test prompt content that is long enough for validation purposes...', modelRef: 'gpt-4', emoji: '💻', status: 'ready' },
      }),
    });
    const user = userEvent.setup();
    render(<AgentConfigPage agents={sampleAgents} />);
    await user.click(screen.getByText('Code Assistant'));
    
    await waitFor(() => {
      expect(screen.getByText('Powrót do listy')).toBeInTheDocument();
    });
  });
});
