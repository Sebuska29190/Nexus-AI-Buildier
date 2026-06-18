/**
 * Ground-Truth Verification — cross-checks agent claims against actual code.
 *
 * Problem: agents produce "evidence" (file:line + tool output) that LOOKS valid
 * but is factually wrong. E.g. agent calls `workspace_search_files("toolBreaker")`
 * which returns 0 results (due to regex/sandbox issues), then claims
 * "toolBreaker is never called" — which is false.
 *
 * This module catches false-negative claims by re-reading the referenced files
 * and verifying the assertion is actually true.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, basename } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..", "..", "..", "..");

// Cache for file path lookups (avoid repeated tree walks)
const fileLookupCache = new Map<string, string>();

export interface VerifiedClaim {
  claim: string;
  isFalseNegative: boolean;   // agent says "X is missing" but X exists
  isFalsePositive: boolean;   // agent says "X exists" but X is missing
  fileChecked: string;
  patternFound: boolean;
  actualSnippet: string;      // what was actually found in the file
}

export interface GroundTruthResult {
  totalClaims: number;
  falseNegatives: number;     // "X never called" but X IS called
  falsePositives: number;     // "X exists" but X doesn't
  accuracy: number;           // 0-1
  falseNegativeDetails: VerifiedClaim[];
  verdict: "ACCURATE" | "MIXED" | "INACCURATE";
}

// Patterns that indicate a negative claim ("X is missing/dead/unused")
const NEGATIVE_PATTERNS = [
  // "X is never called" / "X never called" / "X not called"
  /(\w+(?:\.\w+)?)\s+(?:is\s+)?never\s+(?:called|used|invoked|referenced|defined|implemented|executed|triggered)/i,
  // "no calls to X" / "no X calls"
  /no\s+(?:calls?\s+to\s+)?(\w+(?:\.\w+)?)\s+(?:calls?|exists?|found|usages?|invocations?)/i,
  // "X is dead code" / "X is dead import"
  /(\w+(?:\.\w+)?)\s+(?:is\s+)?(?:dead\s+code|dead\s+import|unused\s+import|never\s+imported|imported\s+but\s+(?:never|not)\s+(?:called|used|invoked))/i,
  // "X imported but never used"
  /(\w+)\s+imported\s+but\s+(?:never|not)\s+(?:used|called|invoked|referenced)/i,
  // "0 results" / "0 results found" for a specific search
  /(?:search(?:ed)?|grep(?:ped)?|find|found)\s+(?:for\s+)?"?(\w+(?:\.\w+)?)?"?\s*(?:→|->|:)?\s*(?:0|zero|no)\s+results?/i,
  // "X not found" / "X not present"
  /(\w+(?:\.\w+)?)\s+(?:not\s+found|not\s+present|doesn't\s+exist|does\s+not\s+exist|is\s+missing)/i,
];

// Patterns to extract the function/method name from the claim
const NAME_EXTRACTORS = [
  /(\w+)\(\)/,                          // foo()
  /(\w+)\.\w+\(\)/,                     // obj.method()
  /`(\w+(?:\.\w+)?)`/,                  // `foo` or `obj.method`
  /import.*?[\s{]([\w]+)[\s}]/,        // import { foo } from ...
];

/**
 * Extract the target name from a claim string.
 * E.g. "toolBreaker is never called" → "toolBreaker"
 */
function extractTargetName(claim: string): string | null {
  for (const re of NAME_EXTRACTORS) {
    const m = claim.match(re);
    if (m) return m[1];
  }
  // Fallback: first word that looks like an identifier
  const m = claim.match(/\b([a-z]\w{2,20})\b/i);
  return m ? m[1] : null;
}

/**
 * Check if a claim is a negative assertion ("X is missing/dead/unused")
 */
function isNegativeClaim(claim: string): { negative: boolean; target: string | null } {
  for (const re of NEGATIVE_PATTERNS) {
    const m = claim.match(re);
    if (m) return { negative: true, target: m[1] || extractTargetName(claim) };
  }
  return { negative: false, target: extractTargetName(claim) };
}

/**
 * Verify a single claim against the actual code.
 * Returns whether the claim is a false negative (agent says X doesn't exist, but it does).
 */
function verifyClaim(
  claim: string,
  referencedFile: string,
  projectRoot: string
): VerifiedClaim | null {
  const { negative, target } = isNegativeClaim(claim);
  if (!target) return null;
  if (target.length < 3) return null; // skip tiny names

  // Resolve the referenced file path
  let filePath = referencedFile.startsWith("/")
    ? join(projectRoot, referencedFile)
    : referencedFile.includes(":\\")
    ? referencedFile  // absolute Windows path
    : join(projectRoot, referencedFile);

  // If direct path doesn't exist, search by filename in src/ directories
  if (!existsSync(filePath)) {
    const fname = basename(filePath);
    const cached = fileLookupCache.get(fname);
    if (cached && existsSync(cached)) {
      filePath = cached;
    } else {
      // Search common source directories
      const searchDirs = [
        join(projectRoot, "packages", "core", "src"),
        join(projectRoot, "packages", "ui", "src"),
        join(projectRoot, "packages", "core"),
        join(projectRoot, "src"),
      ];
      for (const dir of searchDirs) {
        if (!existsSync(dir)) continue;
        try {
          const found = findFileByName(dir, fname);
          if (found) {
            filePath = found;
            fileLookupCache.set(fname, found);
            break;
          }
        } catch { /* skip inaccessible dirs */ }
      }
    }
  }

  if (!existsSync(filePath)) {
    return {
      claim,
      isFalseNegative: false,
      isFalsePositive: false,
      fileChecked: filePath,
      patternFound: false,
      actualSnippet: "(file does not exist)",
    };
  }

  // Read the file (limit to 100KB)
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8").slice(0, 100_000);
  } catch {
    return null;
  }

  // Build search patterns for the target
  const searchPatterns: RegExp[] = [
    new RegExp(`\\b${escapeRegex(target)}\\s*\\(`, "g"),          // foo(
    new RegExp(`\\b${escapeRegex(target)}\\s*\\.\\s*\\w+\\(`, "g"), // foo.method(
    new RegExp(`import\\s+.*\\b${escapeRegex(target)}\\b`, "g"),   // import ... foo ...
    new RegExp(`\\b${escapeRegex(target)}\\b`, "g"),              // any reference
  ];

  // Find the first meaningful match (skip import line if we're looking for usage)
  let found = false;
  let snippet = "";

  for (const re of searchPatterns) {
    const matches = [...content.matchAll(re)];
    if (matches.length > 0) {
      // Check if any match is NOT an import line (i.e. actual usage)
      for (const m of matches) {
        const lineStart = content.lastIndexOf("\n", m.index!) + 1;
        const lineEnd = content.indexOf("\n", m.index!);
        const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);

        // Skip pure import lines if we're checking for usage
        if (negative && line.match(/^\s*import\s/) && matches.length === 1) {
          continue;
        }

        found = true;
        snippet = line.trim().slice(0, 150);
        break;
      }
      if (found) break;
    }
  }

  // For negative claims: agent says "X is missing" but X IS found → false negative
  const isFalseNegative = negative && found;
  const isFalsePositive = !negative && !found;

  if (!isFalseNegative && !isFalsePositive) return null; // no discrepancy

  return {
    claim,
    isFalseNegative,
    isFalsePositive,
    fileChecked: filePath,
    patternFound: found,
    actualSnippet: snippet || "(no snippet)",
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recursively search for a file by name in a directory tree.
 */
function findFileByName(dir: string, fileName: string, maxDepth = 5): string | null {
  if (maxDepth <= 0) return null;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const fullPath = join(dir, entry.name);
      if (entry.isFile() && entry.name === fileName) return fullPath;
      if (entry.isDirectory()) {
        const found = findFileByName(fullPath, fileName, maxDepth - 1);
        if (found) return found;
      }
    }
  } catch { /* skip inaccessible */ }
  return null;
}

/**
 * Run ground-truth verification on an agent's report.
 * Returns a result that the validator can use to adjust its decision.
 */
export function groundTruthVerify(reportText: string): GroundTruthResult {
  const lines = reportText.split("\n");
  const verified: VerifiedClaim[] = [];

  // Extract file references and their associated claims
  const fileClaimPairs: Array<{ file: string; claim: string }> = [];

  for (const line of lines) {
    // Match file:line or file patterns in table cells
    const fileMatches = [
      ...line.matchAll(/`?([\w\/\\.-]+\.(?:ts|tsx|js|jsx|py|go|rs|md))`?(?::\d+)?/g),
      ...line.matchAll(/\|[^|]*?([\w\/\\.-]+\.(?:ts|tsx|js|jsx|py|go|rs)):[\d]+[^|]*\|/g),
    ];

    if (fileMatches.length > 0) {
      const claimText = line.replace(/^[-*\s#|]+/, "").trim();
      if (claimText.length > 15) {
        for (const fm of fileMatches) {
          const filePath = fm[1] || fm[0];
          fileClaimPairs.push({ file: filePath, claim: claimText });
        }
      }
    }
  }

  // Verify each claim
  for (const { file, claim } of fileClaimPairs.slice(0, 20)) {
    const result = verifyClaim(claim, file, PROJECT_ROOT);
    if (result) verified.push(result);
  }

  const falseNegatives = verified.filter(v => v.isFalseNegative);
  const falsePositives = verified.filter(v => v.isFalsePositive);
  const totalChecked = verified.length;
  const correct = totalChecked - falseNegatives.length - falsePositives.length;
  const accuracy = totalChecked > 0 ? correct / totalChecked : 1;

  let verdict: GroundTruthResult["verdict"];
  if (falseNegatives.length === 0 && falsePositives.length === 0) {
    verdict = "ACCURATE";
  } else if (accuracy >= 0.5) {
    verdict = "MIXED";
  } else {
    verdict = "INACCURATE";
  }

  return {
    totalClaims: totalChecked,
    falseNegatives: falseNegatives.length,
    falsePositives: falsePositives.length,
    accuracy,
    falseNegativeDetails: falseNegatives,
    verdict,
  };
}

/**
 * Generate a human-readable ground-truth summary for the validator to prepend.
 */
export function groundTruthSummary(result: GroundTruthResult): string {
  if (result.verdict === "ACCURATE") return "";

  const fnList = result.falseNegativeDetails
    .map(v => `  • "${v.claim.slice(0, 80)}" → ACTUALLY FOUND: ${v.actualSnippet}`)
    .join("\n");

  return `\n\n## 🔍 Ground-Truth Verification FAILED\n` +
    `Verdict: **${result.verdict}** (${Math.round(result.accuracy * 100)}% accuracy)\n` +
    `False negatives (agent says "missing" but exists): ${result.falseNegatives}\n` +
    `False positives (agent says "exists" but missing): ${result.falsePositives}\n` +
    (fnList ? `\n**Evidence of false claims:**\n${fnList}\n` : "") +
    `\nThe agent's tool calls produced incorrect results. Claims about "dead code" or "never called" are factually wrong.`;
}
