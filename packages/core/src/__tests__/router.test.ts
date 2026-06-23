import { describe, it, expect, beforeAll } from "bun:test";
import { capabilityRegistry } from "../agent/router.ts";
import { agentStore } from "../agent/store.ts";

beforeAll(() => {
  agentStore.init(":memory:");
  // Build capability registry with test agents
  const testAgents = [
    { name: "typescript-pro", description: "TypeScript specialist", modelRef: "deepseek/deepseek-chat", emoji: "🔤", skills: ["web_search", "get_current_time"] },
    { name: "python-pro", description: "Python specialist", modelRef: "deepseek/deepseek-chat", emoji: "🐍", skills: ["web_search", "get_current_time"] },
    { name: "rust-engineer", description: "Rust systems programmer", modelRef: "deepseek/deepseek-chat", emoji: "🦀", skills: ["web_search"] },
    { name: "devops-engineer", description: "DevOps, Docker, Kubernetes, Terraform specialist", modelRef: "deepseek/deepseek-chat", emoji: "🐳", skills: ["workspace_run_command"] },
    { name: "api-designer", description: "API design and REST/GraphQL endpoints", modelRef: "deepseek/deepseek-chat", emoji: "🔌", skills: ["web_search"] },
    { name: "code-reviewer", description: "Code review specialist", modelRef: "deepseek/deepseek-chat", emoji: "👁️", skills: ["web_search", "workspace_read_file"] },
    { name: "generalist", description: "General coding assistant", modelRef: "deepseek/deepseek-chat", emoji: "🤖", skills: [] },
  ];
  for (const a of testAgents) {
    try { agentStore.create(a); } catch {}
  }
});

describe("Smart Router v2", () => {
  it("should extract domains from task description", () => {
    const matches = capabilityRegistry.match("fix the TypeScript API endpoint", 5);
    expect(matches.length).toBeGreaterThan(0);
    // Should find agents with typescript or api-design domains
    const topAgent = matches[0];
    expect(topAgent.score).toBeGreaterThan(0);
  });

  it("should rank specialists higher for complex tasks", () => {
    const matches = capabilityRegistry.match(
      "design a microservices architecture with Kubernetes, implement circuit breakers, and set up CI/CD pipeline with Docker and Terraform for a distributed system",
      5
    );
    expect(matches.length).toBeGreaterThan(0);
    // The devops-engineer agent should be ranked highly for this task
    const devopsIndex = matches.findIndex(m => m.agentId === "devops-engineer");
    expect(devopsIndex).toBeGreaterThanOrEqual(0);
    expect(devopsIndex).toBeLessThan(3); // Should be in top 3
  });

  it("should match language-specific tasks", () => {
    const pyMatches = capabilityRegistry.match("write a Python FastAPI endpoint", 3);
    const tsMatches = capabilityRegistry.match("write a TypeScript Express endpoint", 3);
    expect(pyMatches.length).toBeGreaterThan(0);
    expect(tsMatches.length).toBeGreaterThan(0);
  });

  it("should return empty for completely unrelated tasks", () => {
    const matches = capabilityRegistry.match("zzzzz", 5);
    expect(matches.length).toBe(0);
  });

  it("should include trust level in results", () => {
    const matches = capabilityRegistry.match("code review", 3);
    for (const m of matches) {
      expect(m.trustLevel).toBeDefined();
      expect(["verified", "neutral", "low", "degraded"]).toContain(m.trustLevel);
    }
  });

  it("should handle bigram matching", () => {
    const matches = capabilityRegistry.match("react specialist for component architecture", 5);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("should list all capabilities", () => {
    const caps = capabilityRegistry.list();
    expect(caps.length).toBeGreaterThan(0);
    // Each capability should have required fields
    for (const cap of caps) {
      expect(cap.agentId).toBeTruthy();
      expect(cap.name).toBeTruthy();
      expect(typeof cap.specificity).toBe("number");
    }
  });
});
