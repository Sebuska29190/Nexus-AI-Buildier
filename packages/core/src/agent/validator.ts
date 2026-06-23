/**
 * Agent Report Validator — Evidence-Anchored Protocol
 * 
 * Every agent report must include evidence for each claim.
 * Reports without sufficient evidence are REJECTED and the agent gets a strike.
 * 
 * Phase 2: Ground-truth verification catches false-negative claims
 * where agents claim "X is never called" but X actually IS called.
 */
import { groundTruthVerify, groundTruthSummary } from "./ground-truth.ts";

export interface EvidenceClaim {
  claim: string;
  evidence: { file: string; line: number | string; toolOutput: string };
  severity: "critical" | "high" | "medium" | "low";
  verified: boolean;
}

export interface ValidatedReport {
  original: string;
  claims: EvidenceClaim[];
  totalClaims: number;
  verifiedClaims: number;
  evidenceRate: number; // 0-1
  passed: boolean;
  reason: string;
}

/**
 * Extract evidence-anchored claims from agent output
 * Looks for: file:line patterns, backtick-wrapped file paths, tool output quotes
 */
function extractClaims(text: string): EvidenceClaim[] {
  const claims: EvidenceClaim[] = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern: `path/file.ts:123` or `path/file.ts` followed by claim
    const fileLineMatch = line.match(/`?([\w\/\\.-]+\.(?:ts|tsx|js|jsx|py|go|rs|md|json|yaml|toml|sql))`?(?::(\d+))?/g);

    if (fileLineMatch) {
      // Look for a claim — it's usually in the same line or context
      const claimText = line.replace(/^[-*\s#|]+/, "").trim();
      if (claimText.length > 10) {
        // Try to find tool output evidence nearby (next 1-3 lines)
        let toolOutput = "";
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          if (lines[j].includes("→") || lines[j].includes("output:") || lines[j].includes("returns") || lines[j].startsWith("```")) {
            toolOutput = lines[j].trim().slice(0, 200);
            break;
          }
        }

        claims.push({
          claim: claimText.slice(0, 200),
          evidence: {
            file: fileLineMatch[0].replace(/`/g, "").split(":")[0],
            line: parseInt(fileLineMatch[0].match(/:(\d+)/)?.[1] || "0") || "unknown",
            toolOutput: toolOutput || "(no tool output captured)",
          },
          severity: line.toLowerCase().includes("critical") || line.includes("🔴")
            ? "critical" : line.toLowerCase().includes("warn") || line.includes("🟡")
            ? "high" : "medium",
          verified: toolOutput.length > 0,
        });
      }
    }
  }

  return claims.slice(0, 20); // Max 20 claims
}

/**
 * Simple heuristics for claim detection:
 * - Has file reference (path/to/file.ts:line)
 * - Has severity indicator
 * - References a tool used
 */
function countTotalClaims(text: string): number {
  // Count bullet points, numbered items, table rows
  const bullets = (text.match(/^[-*]\s+.+/gm) || []).length;
  const numbers = (text.match(/^\d+\.\s+.+/gm) || []).length;
  const tableRows = (text.match(/^\|.+\|.+\|$/gm) || []).length;
  return Math.max(bullets + numbers + tableRows, 1);
}

/**
 * Validate an agent report against evidence protocol
 */
export function validateReport(text: string): ValidatedReport {
  const claims = extractClaims(text);
  const totalClaims = countTotalClaims(text);
  const verifiedClaims = claims.filter(c => c.verified).length;
  let evidenceRate = totalClaims > 0 ? verifiedClaims / Math.min(totalClaims, 10) : 0;

  let passed = false;
  let reason = "";

  if (claims.length === 0) {
    reason = "REJECTED: No evidence-anchored claims found (no file:line references, no tool output citations)";
  } else if (evidenceRate < 0.3) {
    reason = `REJECTED: Only ${Math.round(evidenceRate * 100)}% of claims have evidence (minimum 30% required). ${verifiedClaims}/${totalClaims} verified.`;
  } else if (evidenceRate >= 0.3 && evidenceRate < 0.6) {
    passed = true;
    reason = `WARNING: ${Math.round(evidenceRate * 100)}% evidence rate. Report accepted with caution.`;
  } else {
    passed = true;
    reason = `PASSED: ${Math.round(evidenceRate * 100)}% of claims verified with evidence.`;
  }

  // ─── Phase 2: Ground-Truth Verification ───────────────────────
  // Catch false-negative claims where agents say "X is missing" but X exists
  const groundTruth = groundTruthVerify(text);
  const gtSummary = groundTruthSummary(groundTruth);

  if (groundTruth.verdict === "INACCURATE") {
    // Agent's claims are factually wrong — override to REJECT
    const adjustedRate = Math.min(evidenceRate, groundTruth.accuracy);
    return {
      original: text,
      claims,
      totalClaims,
      verifiedClaims: Math.max(verifiedClaims - groundTruth.falseNegatives, 0),
      evidenceRate: adjustedRate,
      passed: false,
      reason: `REJECTED: Ground-truth verification FAILED (${Math.round(groundTruth.accuracy * 100)}% accuracy). ${groundTruth.falseNegatives} false-negative claim(s) detected — agent claims code is missing/dead when it actually exists.${gtSummary}`,
    };
  }

  if (groundTruth.verdict === "MIXED") {
    // Some claims are wrong — lower the evidence rate
    evidenceRate = evidenceRate * groundTruth.accuracy;
    reason += gtSummary;
  }

  return { original: text, claims, totalClaims, verifiedClaims, evidenceRate, passed, reason };
}

/**
 * Evidence protocol system prompt — mandatory for all agents
 */
export const EVIDENCE_PROTOCOL_PROMPT = `
## ⚠️ MANDATORY: Evidence Protocol

Every finding in your report MUST include ALL of:
1. **file:line** — exact file path and line number (e.g. \`packages/core/src/agent/runner.ts:306\`)
2. **tool** — which tool you used to verify (e.g. \`workspace_read_file\`, \`workspace_search_files\`)
3. **actual output** — what the tool returned, verbatim (first 200 chars)

Format your findings like this:
\`\`\`
| # | File:Line | Tool Used | Finding | Evidence (actual output) | Severity |
|---|---|---|---|---|---|
| 1 | runner.ts:306 | workspace_read_file | beforeCall IS called | "toolBreaker.beforeCall(callCtx);" | ✅ Verified |
\`\`\`

❌ WRONG: "Somewhere in the code there might be a bug"
✅ CORRECT: "Missing import in \`packages/core/src/agent/runner.ts:18\` — \`workspace_search_files\` confirmed no \`ledger\` import exists. Tool output: '0 results found'"

Reports without these evidence anchors will be REJECTED by the validator.
If you cannot find evidence for a claim, do NOT include that claim in your report.
When no real issues are found, say so honestly and cite the test/build output as evidence.
`;

/**
 * Strike system — tracks agent failures (persistent to SQLite)
 */
import { Database } from "bun:sqlite";
import { join } from "node:path";

class StrikeTracker {
  private db!: Database;
  private mem = new Map<string, { count: number; reasons: string[]; lastStrike: number }>(); // Hot cache
  private initialized = false;

  init(dbPath?: string, db?: Database): void {
    if (this.initialized) return;
    if (db) {
      this.db = db;
    } else {
      const path = dbPath ?? join(process.cwd(), "nova.db");
      this.db = new Database(path);
    }
    this.db.run(`CREATE TABLE IF NOT EXISTS agent_strikes (
      agent_id TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      reasons TEXT NOT NULL DEFAULT '[]',
      last_strike INTEGER NOT NULL DEFAULT 0
    )`);
    // Warm cache from DB
    const rows = this.db.query("SELECT * FROM agent_strikes").all() as any[];
    for (const r of rows) {
      this.mem.set(r.agent_id, {
        count: r.count,
        reasons: JSON.parse(r.reasons || "[]"),
        lastStrike: r.last_strike,
      });
    }
    this.initialized = true;
  }

  private flush(agentId: string): void {
    const entry = this.mem.get(agentId);
    if (!entry) {
      this.db.run("DELETE FROM agent_strikes WHERE agent_id = ?", [agentId]);
      return;
    }
    this.db.run(
      "INSERT OR REPLACE INTO agent_strikes (agent_id, count, reasons, last_strike) VALUES (?, ?, ?, ?)",
      [agentId, entry.count, JSON.stringify(entry.reasons), entry.lastStrike],
    );
  }

  addStrike(agentId: string, reason: string): number {
    const entry = this.mem.get(agentId) || { count: 0, reasons: [], lastStrike: 0 };
    entry.count++;
    entry.reasons.push(reason.slice(0, 200));
    entry.lastStrike = Date.now();
    this.mem.set(agentId, entry);
    this.flush(agentId);
    return entry.count;
  }

  getStrikes(agentId: string): number {
    return this.mem.get(agentId)?.count || 0;
  }

  isDegraded(agentId: string): boolean {
    return this.getStrikes(agentId) >= 3;
  }

  reset(agentId: string): void {
    this.mem.delete(agentId);
    this.flush(agentId);
  }

  getReasons(agentId: string): string[] {
    return this.mem.get(agentId)?.reasons || [];
  }

  getFeedback(agentId: string): string {
    const entry = this.mem.get(agentId);
    if (!entry || entry.count === 0) return "";
    return `\n\n## ⚠️ Previous Strike Feedback\nYou have ${entry.count} strike(s). Fix these issues:\n${entry.reasons.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
  }
}

export const strikeTracker = new StrikeTracker();
