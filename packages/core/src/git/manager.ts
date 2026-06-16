import { execSync } from "child_process";
import type { GitStatus, GitCommit, GitBranch } from "./types";

function git(cwd: string, args: string): string {
  try {
    return execSync(`git ${args}`, { cwd, encoding: "utf-8", timeout: 30000 }).trim();
  } catch (e: any) {
    throw new Error(`Git error: ${e.message}`);
  }
}

export class GitManager {
  async getStatus(cwd: string): Promise<GitStatus> {
    const branch = git(cwd, "branch --show-current");
    const statusOutput = git(cwd, "status --porcelain");
    const aheadBehind = git(cwd, "rev-list --left-right --count @{u}...HEAD 2>/dev/null || echo '0 0'").split("\t");

    const staged: string[] = [];
    const modified: string[] = [];
    const untracked: string[] = [];
    const conflicted: string[] = [];

    for (const line of statusOutput.split("\n").filter(Boolean)) {
      const index = line[0];
      const worktree = line[1];
      const file = line.slice(3);
      if (index === "?" && worktree === "?") untracked.push(file);
      else if (index === "U" || worktree === "U") conflicted.push(file);
      else if (index !== " " && index !== "?") staged.push(file);
      else if (worktree !== " " && worktree !== "?") modified.push(file);
    }

    return {
      branch,
      ahead: parseInt(aheadBehind[1] || "0"),
      behind: parseInt(aheadBehind[0] || "0"),
      staged, modified, untracked, conflicted,
    };
  }

  async diff(cwd: string, target?: string): Promise<string> {
    return git(cwd, target ? `diff ${target}` : "diff");
  }

  async log(cwd: string, count: number = 20): Promise<GitCommit[]> {
    const output = git(cwd, `log -${count} --pretty=format:"%H|%s|%an|%ai"`);
    return output.split("\n").filter(Boolean).map((line) => {
      const [hash, message, author, date] = line.split("|");
      return { hash, message, author, date };
    });
  }

  async branch(cwd: string, name?: string): Promise<string | GitBranch[]> {
    if (name) {
      git(cwd, `branch ${name}`);
      return `Created branch: ${name}`;
    }
    const output = git(cwd, "branch -a --format=%(refname:short)|%(HEAD)%(if)%(HEAD)%(then)%(else)%(objectname:short)%(end)");
    const current = git(cwd, "branch --show-current");
    return output.split("\n").filter(Boolean).map((line) => {
      const [name] = line.split("|");
      return { name: name.replace("remotes/", ""), current: name === current, remote: name.startsWith("remotes/") ? "origin" : "" };
    });
  }

  async checkout(cwd: string, branch: string): Promise<string> {
    git(cwd, `checkout ${branch}`);
    return `Switched to branch: ${branch}`;
  }

  async commit(cwd: string, message: string, files?: string[]): Promise<string> {
    if (files?.length) {
      git(cwd, `add ${files.join(" ")}`);
    } else {
      git(cwd, "add -A");
    }
    git(cwd, `commit -m "${message.replace(/"/g, '\\"')}"`);
    return `Committed: ${message}`;
  }

  async push(cwd: string, remote: string = "origin", branch?: string): Promise<string> {
    const b = branch || git(cwd, "branch --show-current");
    git(cwd, `push ${remote} ${b}`);
    return `Pushed to ${remote}/${b}`;
  }

  async pull(cwd: string, remote: string = "origin", branch?: string): Promise<string> {
    const b = branch || git(cwd, "branch --show-current");
    git(cwd, `pull ${remote} ${b}`);
    return `Pulled from ${remote}/${b}`;
  }

  async merge(cwd: string, branch: string): Promise<string> {
    git(cwd, `merge ${branch}`);
    return `Merged: ${branch}`;
  }

  async stash(cwd: string, message?: string): Promise<string> {
    git(cwd, message ? `stash push -m "${message.replace(/"/g, '\\"')}"` : "stash push");
    return "Changes stashed";
  }

  async stashPop(cwd: string): Promise<string> {
    git(cwd, "stash pop");
    return "Stash applied";
  }

  async blame(cwd: string, file: string): Promise<string> {
    return git(cwd, `blame ${file}`);
  }
}

export const gitManager = new GitManager();
