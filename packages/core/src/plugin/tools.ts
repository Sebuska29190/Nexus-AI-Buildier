import type { ToolPlugin, ToolContext } from "@nova/sdk";

const tools = new Map<string, ToolPlugin>();

// Safety: block dangerous commands
function checkDangerousCommand(cmd: string): string | null {
  const patterns: [RegExp, string][] = [
    [/\brm\s+-rf\s+\//i, "Recursive delete of root is blocked"],
    [/\bformat\s+[cde]:/i, "Format of drives is blocked"],
    [/\bdd\s+if=\/dev\/sd/i, "Direct disk write is blocked"],
    [/\bkill\s+-9\s+1\b/i, "Killing PID 1 is blocked"],
  ];
  for (const [pat, reason] of patterns) {
    if (pat.test(cmd)) return reason;
  }
  return null;
}

export function registerTool(t: ToolPlugin): void {
  tools.set(t.name, t);
}

export function getTool(name: string): ToolPlugin | undefined {
  return tools.get(name);
}

export function listTools(): ToolPlugin[] {
  return [...tools.values()];
}

// ─── Web Tools ──────────────────────────────────────────────────────────────

registerTool({
  name: "web_fetch",
  description: "Fetch a URL and return text content",
  parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"], additionalProperties: false },
  async execute(args, ctx) {
    const { url } = args as { url: string };
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "Nova/1.0" } });
    return (await res.text()).slice(0, 15000);
  },
});

registerTool({
  name: "web_search",
  description: "Search the web via DuckDuckGo",
  parameters: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"], additionalProperties: false },
  async execute(args) {
    const { query } = args as { query: string };
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://lite.duckduckgo.com/lite/?q=${encoded}`, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Nova/1.0" },
    });
    const html = await res.text();
    const results: string[] = [];
    const regex = /<a[^>]*class="result-link"[^>]*>([^<]+)<\/a>\s*<span[^>]*class="result-snippet"[^>]*>([^<]+)<\/span>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      results.push(`${m[1].trim()}: ${m[2].trim()}`);
      if (results.length >= 10) break;
    }
    return results.length > 0 ? results.join("\n") : "No results found";
  },
});

// ─── Time Tool ──────────────────────────────────────────────────────────────

registerTool({
  name: "get_current_time",
  description: "Get current date and time",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async execute() { return new Date().toISOString(); },
});

// ─── Workspace Tools ────────────────────────────────────────────────────────

import { workspaceManager } from "../workspace/manager.ts";
import { execSync } from "node:child_process";

/** Guard: check workspace and return root path or error message */
function workspaceGuard(): { ok: false; msg: string } | { ok: true; root: string } {
  if (!workspaceManager.isActive()) {
    return { ok: false, msg: "❌ No workspace folder is set. Open the Workspace panel in the chat UI and set a folder." };
  }
  return { ok: true, root: workspaceManager.getRoot() };
}

registerTool({
  name: "workspace_set_root",
  description: "Set the workspace root folder for file operations",
  parameters: { type: "object", properties: { path: { type: "string", description: "Absolute path to the workspace root folder" } }, required: ["path"], additionalProperties: false },
  async execute(args) {
    const { path } = args as { path: string };
    const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
    // Blocked system paths (case-insensitive, both POSIX and Windows)
    const BLOCKED_POSIX = ["/windows", "/windows/system32", "/etc", "/root", "/boot", "/sys", "/proc", "/dev", "/bin", "/sbin", "/usr/lib", "/var/run", "/usr", "/home"];
    const BLOCKED_WIN = ["c:/windows", "c:/windows/system32", "c:/program files", "c:/program files (x86)", "c:/users/all users", "c:/system volume information", "c:/recovery", "c:/$recycle.bin"];
    const lower = normalized.toLowerCase();
    // Check POSIX paths
    for (const blocked of BLOCKED_POSIX) {
      if (lower === blocked || lower.startsWith(blocked + "/")) {
        return `❌ Security: Cannot set workspace to system path "${path}". Choose a project or home directory.`;
      }
    }
    // Check Windows paths (strip drive letter prefix for matching)
    const noDrive = lower.replace(/^[a-z]:\//, "/");
    for (const blocked of BLOCKED_WIN) {
      const bClean = blocked.replace(/^[a-z]:\//, "/");
      if (noDrive === bClean || noDrive.startsWith(bClean + "/")) {
        return `❌ Security: Cannot set workspace to system path "${path}". Choose a project or home directory.`;
      }
    }
    // Path traversal check
    if (normalized.includes("/../") || normalized.includes("/./") || normalized.endsWith("/..")) {
      return `❌ Security: Path traversal detected in "${path}"`;
    }
    workspaceManager.setRoot(path);
    return `✅ Workspace root set to: ${path}`;
  },
});

registerTool({
  name: "workspace_get_state",
  description: "Show current workspace status — root folder, file/dir counts",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async execute() {
    const state = workspaceManager.getState();
    const active = state && state.active;
    if (!active) return "❌ No workspace folder is set. Open the Workspace panel in the chat UI and set a folder.";
    const folders = state.folders.length > 1
      ? "\n- Folders: " + state.folders.length + "\n" + state.folders.map(f => `  - \`${f}\``).join("\n")
      : "";
    return `**Workspace:** \`${state.rootDir}\`${folders}\n- Active: ✅\n- Files: ${state.fileCount}\n- Directories: ${state.dirCount}\n- Created: ${state.createdAt}`;
  },
});

registerTool({
  name: "workspace_list_files",
  description: "List files and directories in the workspace, with optional depth and extension filter",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Subdirectory to list (default: root)" },
      depth: { type: "number", description: "Max directory depth (default: 2, max: 5)" },
      ext: { type: "string", description: "Filter by file extension e.g. .ts, .py (optional)" },
    },
    additionalProperties: false,
  },
  async execute(args) {
    const guard = workspaceGuard();
    if (!guard.ok) return guard.msg;
    const { path = "", depth = 2, ext } = args as { path?: string; depth?: number; ext?: string };
    const maxDepth = Math.min(depth || 2, 5);
    const files = workspaceManager.listFiles(path as string, { ext: ext as string | undefined, maxDepth });
    if (files.length === 0) return "(empty — no files found)";
    const lines = files.map(f =>
      `${f.type === "dir" ? "📁" : "📄"} ${f.path}${f.type === "dir" ? "/" : ""} ${f.type === "file" ? `(${(f.size / 1024).toFixed(1)} KB)` : ""}`
    );
    return lines.join("\n");
  },
});

registerTool({
  name: "workspace_read_file",
  description: "Read the full contents of a file from the workspace (max 1 MB)",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative file path from workspace root, e.g. src/main.ts" },
    },
    required: ["path"],
    additionalProperties: false,
  },
  async execute(args) {
    const guard = workspaceGuard();
    if (!guard.ok) return guard.msg;
    const { path } = args as { path: string };
    const content = workspaceManager.readFile(path);
    if (content === null) return `Error: File "${path}" not found, is empty, or exceeds 1 MB. Use workspace_list_files to check available files.`;
    return content;
  },
});

registerTool({
  name: "workspace_write_file",
  description: "Create or overwrite a file in the workspace. Creates parent directories automatically.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative file path, e.g. src/index.ts" },
      content: { type: "string", description: "Full file content to write" },
    },
    required: ["path", "content"],
    additionalProperties: false,
  },
  async execute(args) {
    const guard = workspaceGuard();
    if (!guard.ok) return guard.msg;
    const { path, content } = args as { path: string; content: string };
    const ok = workspaceManager.writeFile(path, content);
    if (!ok) return `Error: Failed to write "${path}". Check permissions and path validity.`;
    return `✅ Written ${content.length} bytes to \`${path}\``;
  },
});

registerTool({
  name: "workspace_edit_file",
  description: "Find exact text in a file and replace it. Uses first occurrence. Good for surgical edits.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative file path" },
      old_string: { type: "string", description: "Exact text to find (must match byte-for-byte)" },
      new_string: { type: "string", description: "Replacement text" },
    },
    required: ["path", "old_string", "new_string"],
    additionalProperties: false,
  },
  async execute(args) {
    const guard = workspaceGuard();
    if (!guard.ok) return guard.msg;
    const { path, old_string, new_string } = args as { path: string; old_string: string; new_string: string };
    const content = workspaceManager.readFile(path);
    if (content === null) return `Error: File "${path}" not found.`;
    if (!content.includes(old_string)) return `Error: old_string not found in "${path}". Check exact whitespace.`;
    const updated = content.replace(old_string, new_string);
    const ok = workspaceManager.writeFile(path, updated);
    if (!ok) return `Error: Failed to write updated "${path}".`;
    const linesChanged = content.split("\n").length;
    return `✅ Edited \`${path}\` — replaced 1 occurrence (${linesChanged} line file).`;
  },
});

registerTool({
  name: "workspace_delete_file",
  description: "Delete a file or empty directory from the workspace",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path to file or directory to delete" },
    },
    required: ["path"],
    additionalProperties: false,
  },
  async execute(args) {
    const guard = workspaceGuard();
    if (!guard.ok) return guard.msg;
    const { path } = args as { path: string };
    const ok = workspaceManager.delete(path);
    if (!ok) return `Error: "${path}" not found or could not be deleted.`;
    return `✅ Deleted \`${path}\``;
  },
});

registerTool({
  name: "workspace_search_files",
  description: "Search for files by name pattern (case-insensitive, e.g. 'config' finds all files containing 'config')",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Filename pattern to search for" },
      path: { type: "string", description: "Subdirectory to restrict search (optional)" },
    },
    required: ["pattern"],
    additionalProperties: false,
  },
  async execute(args) {
    const guard = workspaceGuard();
    if (!guard.ok) return guard.msg;
    const { pattern, path = "" } = args as { pattern: string; path?: string };
    const results = workspaceManager.searchFiles(pattern, path);
    if (results.length === 0) return `No files matching "${pattern}" found.`;
    return results.map(r => `📄 ${r}`).join("\n") + `\n\n(${results.length} file(s) found)`;
  },
});

registerTool({
  name: "workspace_run_command",
  description: "Run a shell command inside the workspace directory. Use for git, npm, pip, build, test, etc.",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to execute" },
      timeout: { type: "number", description: "Timeout in seconds (default: 30, max: 120)" },
    },
    required: ["command"],
    additionalProperties: false,
  },
  async execute(args) {
    const guard = workspaceGuard();
    if (!guard.ok) return guard.msg;
    const { command, timeout = 30 } = args as { command: string; timeout?: number };

    const danger = checkDangerousCommand(command);
    if (danger) return `❌ Blocked: ${danger}`;

    const maxTimeout = Math.min(timeout, 120) * 1000;
    try {
      const output = execSync(command, {
        cwd: guard.root,
        timeout: maxTimeout,
        maxBuffer: 5 * 1024 * 1024,
        shell: true,
        encoding: "utf-8",
        windowsHide: true,
      });
      const result = (output || "").trim();
      if (!result) return `✅ Command completed (no output)`;
      return result.length > 5000 ? result.slice(0, 5000) + `\n\n... (${result.length - 5000} more chars)` : result;
    } catch (e: unknown) {
      const err = e as any;
      const stderr = err.stderr?.toString().trim() || err.message || "Unknown error";
      return `❌ Command failed: ${stderr.slice(0, 2000)}`;
    }
  },
});

// ─── Checkpoint Tools ───────────────────────────────────────────────────────

registerTool({
  name: "create_checkpoint",
  description: "Create a file backup snapshot before making changes. Restore with restore_checkpoint. Use before risky file operations.",
  parameters: { type: "object", properties: { description: { type: "string", default: "auto-checkpoint" }, files: { type: "array", items: { type: "string" }, description: "File paths to backup (optional — defaults to current workspace files)" } }, additionalProperties: false },
  async execute(args: any) {
    const { makeSnapshot, listSnapshots } = await import("../checkpoint/store.ts");
    const desc = args.description || `checkpoint_${Date.now()}`;
    const files = args.files || [];
    const snapshot = makeSnapshot(desc, files);
    return `✅ Checkpoint created: ${snapshot.id}\n${snapshot.description}\n${snapshot.files.length} file(s) backed up`;
  },
});

registerTool({
  name: "restore_checkpoint",
  description: "Restore files from a previous checkpoint. Use checkpoint ID from list_checkpoints.",
  parameters: { type: "object", properties: { id: { type: "string", description: "Checkpoint ID to restore from" } }, required: ["id"], additionalProperties: false },
  async execute(args: any) {
    const { rewindFiles, listSnapshots } = await import("../checkpoint/store.ts");
    const snapshots = listSnapshots();
    const snap = snapshots.find(s => s.id === args.id);
    if (!snap) return `❌ Checkpoint "${args.id}" not found. Use list_checkpoints to see available IDs.`;
    const count = rewindFiles(args.id);
    return `✅ Restored ${count} file(s) from checkpoint ${args.id} (${snap.description})`;
  },
});
