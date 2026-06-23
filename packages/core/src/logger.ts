/**
 * Structured Logger for Nexus AI
 *
 * Dodaje timestampy i poziomy logowania do konsoli.
 * Zachowuje formatowanie kolorów używane w projekcie.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = (process.env.NOVA_LOG_LEVEL as LogLevel) || "info";

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

export const logger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (!shouldLog("debug")) return;
    console.debug(`[${timestamp()}] [DEBUG] ${msg}`, ...args);
  },

  info: (msg: string, ...args: unknown[]) => {
    if (!shouldLog("info")) return;
    // Pasuje do istniejącego formatowania: `  ✓`, `  ⚠`, `  🧠`
    console.log(`[${timestamp()}] ${msg}`, ...args);
  },

  warn: (msg: string, ...args: unknown[]) => {
    if (!shouldLog("warn")) return;
    console.warn(`[${timestamp()}] [WARN] ${msg}`, ...args);
  },

  error: (msg: string, ...args: unknown[]) => {
    if (!shouldLog("error")) return;
    console.error(`[${timestamp()}] [ERROR] ${msg}`, ...args);
  },

  /** Legacy helper: log z ikoną (zgodność z istniejącym stylem) */
  icon: (icon: string, msg: string) => {
    if (!shouldLog("info")) return;
    console.log(`[${timestamp()}]  ${icon} ${msg}`);
  },

  /** Startup banner */
  banner: (title: string) => {
    console.log(`\n  ╔═══════════════════════════════════════╗`);
    console.log(`  ║       ${title.padEnd(36)}║`);
    console.log(`  ╚═══════════════════════════════════════╝\n`);
  },

  /** Line separator with optional label */
  section: (label?: string) => {
    console.log(label ? `\n  ─── ${label} ───` : `\n  ─────────────────────────────────`);
  },
};
