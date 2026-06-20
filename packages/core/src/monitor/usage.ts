/**
 * Usage tracker stub — minimal implementation for compatibility
 */

interface UsageLog {
  agentId: string;
  sessionId: string;
  modelRef: string;
  action: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  durationMs: number;
}

class UsageTracker {
  private initialized = false;

  init(dbPath?: string): void {
    this.initialized = true;
  }

  log(entry: UsageLog): void {
    // Stub — no-op
  }
}

export const usageTracker = new UsageTracker();
