import { registerTool } from "../plugin/tools.ts";
import { SUB_AGENTS } from "./sub-agents.ts";
import type { TaskPlan } from "./types.ts";

export function registerChatTools(): void {
  // Sub-agent delegation tool
  registerTool({
    name: "delegate",
    description: `Delegate a task to a specialized sub-agent. Agents: ${SUB_AGENTS.map((a) => `${a.id} (${a.description})`).join(", ")}`,
    parameters: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Sub-agent ID: developer, auditor, researcher, api-connector" },
        task: { type: "string", description: "Exact task/instruction for the sub-agent" },
      },
      required: ["agentId", "task"],
    },
    async execute(args: Record<string, unknown>) {
      const { agentId, task } = args as { agentId: string; task: string };
      const { OrchestratorAgent } = await import("./OrchestratorAgent.ts");
      const orch = new OrchestratorAgent();
      const results = await orch.executePlan({
        reasoning: "",
        tasks: [{ agentId, instruction: task, dependsOn: [] }],
      });
      const r = results[0];
      if (!r) return "No result from sub-agent.";
      if (r.error) return `❌ ${agentId} failed: ${r.error}`;
      return r.result;
    },
  });

  // List sub-agents tool
  registerTool({
    name: "list_sub_agents",
    description: "List all available specialized sub-agents",
    parameters: { type: "object", properties: {} },
    async execute() {
      return SUB_AGENTS.map(
        (a) => `- ${a.id}: ${a.name} — ${a.description}\n  Tools: ${a.tools.join(", ")}`,
      ).join("\n\n");
    },
  });

  // Plan task tool
  registerTool({
    name: "plan_task",
    description: "Analyze a complex task and create a multi-agent execution plan",
    parameters: {
      type: "object",
      properties: {
        task: { type: "string", description: "The task to analyze and plan" },
      },
      required: ["task"],
    },
    async execute(args: Record<string, unknown>) {
      const { task } = args as { task: string };
      const { OrchestratorAgent } = await import("./OrchestratorAgent.ts");
      const orch = new OrchestratorAgent();
      const plan: TaskPlan = await orch.planTask(task);
      return `## Plan\n${plan.reasoning}\n\n## Tasks\n${
        plan.tasks.map((t: { agentId: string; instruction: string; dependsOn: number[] }, i: number) => `${i}. **${t.agentId}**: ${t.instruction}${t.dependsOn.length ? ` (depends on: ${t.dependsOn.join(", ")})` : ""}`).join("\n")
      }`;
    },
  });
}
