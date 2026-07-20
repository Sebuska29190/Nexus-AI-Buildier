import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = WebSocket.CONNECTING;
  close = vi.fn();
  send = vi.fn();
  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }
}
(global as any).WebSocket = MockWebSocket;

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'mock-uuid' },
  configurable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { host: 'localhost:4123' },
  writable: true,
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useChat', () => {
  it('initializes with a welcome message', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.messages[0].content).toContain('Welcome to AgentForge');
  });

  it('starts disconnected', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.connected).toBe(false);
  });

  it('connects WebSocket on mount', async () => {
    renderHook(() => useChat());
    await vi.advanceTimersByTimeAsync(20);
    // WebSocket should be connecting
    expect(typeof (global as any).WebSocket).toBe('function');
  });

  it('exposes send, approve, reject, abort, clearMessages functions', () => {
    const { result } = renderHook(() => useChat());
    expect(typeof result.current.send).toBe('function');
    expect(typeof result.current.approve).toBe('function');
    expect(typeof result.current.reject).toBe('function');
    expect(typeof result.current.abort).toBe('function');
    expect(typeof result.current.clearMessages).toBe('function');
  });

  it('exposes all required state fields', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current).toHaveProperty('connected');
    expect(result.current).toHaveProperty('messages');
    expect(result.current).toHaveProperty('streamingContent');
    expect(result.current).toHaveProperty('thinking');
    expect(result.current).toHaveProperty('isThinking');
    expect(result.current).toHaveProperty('pendingApprovals');
    expect(result.current).toHaveProperty('activity');
    expect(result.current).toHaveProperty('isRunning');
    expect(result.current).toHaveProperty('sessionId');
    expect(result.current).toHaveProperty('error');
  });

  it('clearMessages resets to welcome message', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.clearMessages();
    });
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].content).toContain('New Session');
  });
});
