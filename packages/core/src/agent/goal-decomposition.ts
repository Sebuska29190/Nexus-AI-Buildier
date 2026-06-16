/**
 * Goal Decomposition — Break complex goals into subtasks
 * Uses LLM to analyze goals and create structured task plans
 */
import { randomUUID } from "node:crypto";
import { registerTool } from "../plugin/tools";
import { safeMessage } from "../errors";

interface GoalTask {
  id: string;
  description: string;
  dependencies: string[];
  toolsNeeded: string[];
  estimatedSteps: number;
  status: "pending" | "in_progress" | "completed" | "failed";
}

interface GoalPlan {
  id: string;
  goal: string;
  tasks: GoalTask[];
  estimatedComplexity: "low" | "medium" | "high";
  estimatedTime: string;
  createdAt: string;
}

const activePlans: Map<string, GoalPlan> = new Map();

async function decomposeGoal(goal: string, context?: string): Promise<GoalPlan> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No API key configured for goal decomposition");

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: `You are a project planning expert. Break down the given goal into a structured task plan.

Return JSON with this exact structure:
{
  "tasks": [
    {
      "description": "Clear task description",
      "dependencies": ["task_id_that_must_complete_first"],
      "tools_needed": ["tool1", "tool2"],
      "estimated_steps": 3
    }
  ],
  "complexity": "low|medium|high",
  "estimated_time": "e.g., 2 hours"
}

Rules:
- Each task should be atomic (one clear action)
- Dependencies must reference other task indices (0-based)
- Be specific about which tools are needed
- Order tasks by logical dependency` },
        { role: "user", content: `Goal: ${goal}${context ? `\nContext: ${context}` : ""}` },
      ],
      max_tokens: 1000,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error(`LLM request failed: ${response.status}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse LLM response");

  const parsed = JSON.parse(jsonMatch[0]);
  const planId = randomUUID().slice(0, 12);
  const now = new Date().toISOString();

  const tasks: GoalTask[] = (parsed.tasks || []).map((t: any, i: number) => ({
    id: `task-${i}`,
    description: t.description,
    dependencies: (t.dependencies || []).map((d: number) => `task-${d}`),
    toolsNeeded: t.tools_needed || [],
    estimatedSteps: t.estimated_steps || 1,
    status: "pending" as const,
  }));

  const plan: GoalPlan = {
    id: planId,
    goal,
    tasks,
    estimatedComplexity: parsed.complexity || "medium",
    estimatedTime: parsed.estimated_time || "unknown",
    createdAt: now,
  };

  activePlans.set(planId, plan);
  return plan;
}

// ─── Tools ──────────────────────────────────────────────────
registerTool({
  name: "decompose_goal",
  description: "Break a complex goal into structured subtasks with dependencies",
  parameters: {
    type: "object",
    properties: {
      goal: { type: "string", description: "The goal to decompose" },
      context: { type: "string", description: "Additional context" },
    },
    required: ["goal"],
  },
  async execute(args: { goal: string; context?: string }) {
    const plan = await decomposeGoal(args.goal, args.context);
    const lines = [`**Goal Plan: ${plan.id}**\n`];
    lines.push(`Goal: ${plan.goal}`);
    lines.push(`Complexity: ${plan.estimatedComplexity}`);
    lines.push(`Estimated time: ${plan.estimatedTime}`);
    lines.push(`\n**Tasks (${plan.tasks.length}):**\n`);
    for (const task of plan.tasks) {
      const deps = task.dependencies.length > 0 ? ` (depends on: ${task.dependencies.join(", ")})` : "";
      const tools = task.toolsNeeded.length > 0 ? ` [tools: ${task.toolsNeeded.join(", ")}]` : "";
      lines.push(`- **${task.id}**: ${task.description}${deps}${tools}`);
    }
    return lines.join("\n");
  },
});

registerTool({
  name: "plan_status",
  description: "Get status of an active goal plan",
  parameters: {
    type: "object",
    properties: { planId: { type: "string", description: "Plan ID" } },
    required: ["planId"],
  },
  async execute(args: { planId: string }) {
    const plan = activePlans.get(args.planId);
    if (!plan) return "Plan not found";
    const completed = plan.tasks.filter(t => t.status === "completed").length;
    return `Plan: ${plan.goal}\nProgress: ${completed}/${plan.tasks.length} tasks\nStatus: ${plan.tasks.map(t => `${t.id}: ${t.status}`).join(", ")}`;
  },
});

registerTool({
  name: "plan_update",
  description: "Update the status of a task in a plan",
  parameters: {
    type: "object",
    properties: {
      planId: { type: "string", description: "Plan ID" },
      taskId: { type: "string", description: "Task ID" },
      status: { type: "string", description: "New status: completed, failed, in_progress" },
    },
    required: ["planId", "taskId", "status"],
  },
  async execute(args: { planId: string; taskId: string; status: string }) {
    const plan = activePlans.get(args.planId);
    if (!plan) return "Plan not found";
    const task = plan.tasks.find(t => t.id === args.taskId);
    if (!task) return "Task not found";
    task.status = args.status as any;
    return `Updated ${args.taskId} to ${args.status}`;
  },
});

registerTool({
  name: "plan_next",
  description: "Get the next task to execute in a plan (respects dependencies)",
  parameters: {
    type: "object",
    properties: { planId: { type: "string", description: "Plan ID" } },
    required: ["planId"],
  },
  async execute(args: { planId: string }) {
    const plan = activePlans.get(args.planId);
    if (!plan) return "Plan not found";

    // Find tasks whose dependencies are all completed
    const next = plan.tasks.find(t => {
      if (t.status !== "pending") return false;
      return t.dependencies.every(depId => {
        const dep = plan.tasks.find(d => d.id === depId);
        return dep?.status === "completed";
      });
    });

    if (!next) return "No pending tasks with completed dependencies (plan may be complete)";
    next.status = "in_progress";
    return `Next task: **${next.id}** — ${next.description}\nTools needed: ${next.toolsNeeded.join(", ") || "none"}\nEstimated steps: ${next.estimatedSteps}`;
  },
});

console.log("[goal] Goal Decomposition initialized with 4 tools");
