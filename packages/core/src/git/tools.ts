import { registerTool } from "../plugin/tools";
import { gitManager } from "./manager";

const cwd = process.cwd();

registerTool({
  name: "git_status",
  description: "Get git status: branch, ahead/behind, staged/modified/untracked files",
  parameters: { type: "object" as const, properties: { path: { type: "string", description: "Working directory" } }, required: [] },
  execute: async (args: any) => JSON.stringify(await gitManager.getStatus(args.path || cwd), null, 2),
});

registerTool({
  name: "git_diff",
  description: "Show git diff of changes",
  parameters: { type: "object" as const, properties: { target: { type: "string", description: "Diff target (branch, commit, etc.)" }, path: { type: "string", description: "Working directory" } }, required: [] },
  execute: async (args: any) => await gitManager.diff(args.path || cwd, args.target),
});

registerTool({
  name: "git_log",
  description: "Show recent git commit history",
  parameters: { type: "object" as const, properties: { count: { type: "number", description: "Number of commits to show" }, path: { type: "string", description: "Working directory" } }, required: [] },
  execute: async (args: any) => JSON.stringify(await gitManager.log(args.path || cwd, args.count || 10), null, 2),
});

registerTool({
  name: "git_branch",
  description: "List branches or create a new branch",
  parameters: { type: "object" as const, properties: { name: { type: "string", description: "Branch name to create (omit to list)" }, path: { type: "string", description: "Working directory" } }, required: [] },
  execute: async (args: any) => JSON.stringify(await gitManager.branch(args.path || cwd, args.name), null, 2),
});

registerTool({
  name: "git_checkout",
  description: "Switch to a different branch",
  parameters: { type: "object" as const, properties: { branch: { type: "string", description: "Branch name to switch to" }, path: { type: "string", description: "Working directory" } }, required: ["branch"] },
  execute: async (args: any) => await gitManager.checkout(args.path || cwd, args.branch),
});

registerTool({
  name: "git_commit",
  description: "Stage all changes and commit with a message",
  parameters: { type: "object" as const, properties: { message: { type: "string", description: "Commit message" }, files: { type: "array", items: { type: "string" }, description: "Specific files to stage" }, path: { type: "string", description: "Working directory" } }, required: ["message"] },
  execute: async (args: any) => await gitManager.commit(args.path || cwd, args.message, args.files),
});

registerTool({
  name: "git_push",
  description: "Push commits to remote",
  parameters: { type: "object" as const, properties: { remote: { type: "string", description: "Remote name" }, branch: { type: "string", description: "Branch name" }, path: { type: "string", description: "Working directory" } }, required: [] },
  execute: async (args: any) => await gitManager.push(args.path || cwd, args.remote, args.branch),
});

registerTool({
  name: "git_pull",
  description: "Pull commits from remote",
  parameters: { type: "object" as const, properties: { remote: { type: "string", description: "Remote name" }, branch: { type: "string", description: "Branch name" }, path: { type: "string", description: "Working directory" } }, required: [] },
  execute: async (args: any) => await gitManager.pull(args.path || cwd, args.remote, args.branch),
});

registerTool({
  name: "git_stash",
  description: "Stash current changes",
  parameters: { type: "object" as const, properties: { message: { type: "string", description: "Stash message" }, path: { type: "string", description: "Working directory" } }, required: [] },
  execute: async (args: any) => await gitManager.stash(args.path || cwd, args.message),
});

registerTool({
  name: "git_stash_pop",
  description: "Apply most recent stash",
  parameters: { type: "object" as const, properties: { path: { type: "string", description: "Working directory" } }, required: [] },
  execute: async (args: any) => await gitManager.stashPop(args.path || cwd),
});

registerTool({
  name: "git_blame",
  description: "Show blame for a file",
  parameters: { type: "object" as const, properties: { file: { type: "string", description: "File path" }, path: { type: "string", description: "Working directory" } }, required: ["file"] },
  execute: async (args: any) => await gitManager.blame(args.path || cwd, args.file),
});

console.log("[git] Registered 11 git tools");
