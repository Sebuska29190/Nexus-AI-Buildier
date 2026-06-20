/**
 * Tool approval system for risky operations.
 * Allows the user to approve/reject tool calls before execution.
 */

import type { ToolPlugin } from "@nova/sdk";

export interface ApprovalResult {
  approved: boolean;
  alwaysAllow?: boolean;
}

interface PendingApproval {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  riskLevel: "safe" | "risky";
  sessionId: string;
  resolve: (result: ApprovalResult) => void;
  reject: (err: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  timestamp: number;
}

const pendingApprovals = new Map<string, PendingApproval>();
const alwaysAllowedTools = new Map<string, Set<string>>();

const SAFE_PATTERN = /^(workspace_read|workspace_list|workspace_search|workspace_get_state|web_fetch|web_search|get_current_time|calculate|list_checkpoints|workspace_list_folders|workspace_tree)/i;
const RISKY_PATTERN = /^(workspace_write|workspace_edit|workspace_delete|workspace_run|workspace_add_folder|workspace_remove_folder|create_checkpoint|restore_checkpoint|spawn_sub_agent|handoff_to_agent|orchestrate|workspace_run_command|workspace_set_root)/i;

export function classifyToolRisk(toolName: string): "safe" | "risky" {
  if (SAFE_PATTERN.test(toolName)) return "safe";
  if (RISKY_PATTERN.test(toolName)) return "risky";
  return "risky";
}

export function requestApproval(
  toolCallId: string,
  toolName: string,
  args: Record<string, unknown>,
  riskLevel: "safe" | "risky",
  sessionId: string,
  autoApprove = false,
  allowCheck = true,
): Promise<ApprovalResult> {
  if (autoApprove) return Promise.resolve({ approved: true });
  if (allowCheck && alwaysAllowedTools.get(sessionId)?.has(toolName)) {
    return Promise.resolve({ approved: true });
  }

  return new Promise<ApprovalResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingApprovals.delete(toolCallId);
      reject(new Error(`Approval timeout for "${toolName}"`));
    }, 120_000);

    pendingApprovals.set(toolCallId, {
      toolCallId, toolName, args, riskLevel, sessionId,
      resolve, reject, timeout, timestamp: Date.now(),
    });
  });
}

export function resolveApproval(
  toolCallId: string,
  approved: boolean,
  alwaysAllow = false,
  sessionId?: string,
): boolean {
  const entry = pendingApprovals.get(toolCallId);
  if (!entry) return false;
  clearTimeout(entry.timeout);
  pendingApprovals.delete(toolCallId);
  if (alwaysAllow && sessionId) {
    const list = alwaysAllowedTools.get(sessionId) || new Set();
    list.add(entry.toolName);
    alwaysAllowedTools.set(sessionId, list);
  }
  entry.resolve({ approved, alwaysAllow });
  return true;
}

export function cleanupSession(sessionId: string): void {
  for (const [id, entry] of pendingApprovals) {
    if (entry.sessionId === sessionId) {
      clearTimeout(entry.timeout);
      entry.reject(new Error("Session closed"));
      pendingApprovals.delete(id);
    }
  }
  alwaysAllowedTools.delete(sessionId);
}
