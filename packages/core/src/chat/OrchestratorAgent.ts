import { piHarness } from "../harness/pi.ts";
import { registry } from "../plugin/registry.ts";
import { sessionManager } from "../session/manager.ts";
import type { AgentMessage } from "@nova/sdk";
import { SUB_AGENTS } from "./sub-agents.ts";
import { runSubAgent, runSubAgentsParallel } from "./SubAgentRuntime.ts";
import type { TaskPlan, TaskPlanItem } from "./types.ts";
import type { SubAgentResult } from "./SubAgentRuntime.ts";

export { SUB_AGENTS };

/**
 * OrchestratorAgent — the Conductor.
 * Analyzes user prompts, plans subtask delegation, executes sub-agents,
 * merges results, and provides graceful degradation.
 */
export class OrchestratorAgent {
  private modelRef: string;
  private signal?: AbortSignal;

  constructor(modelRef = "deepseek/deepseek-chat", signal?: AbortSignal) {
    this.modelRef = modelRef;
    this.signal = signal;
  }

  /**
   * Analyze a task and produce a plan with subtask delegation.
   * Uses the LLM to do Chain-of-Thought planning.
   */
  async planTask(task: string): Promise<TaskPlan> {
    const agentList = SUB_AGENTS.map(
      (a) => `- ${a.id}: ${a.description}`,
    ).join("\n");

    const prompt = `Analyze this coding task and break it into subtasks for specialized agents.

Available agents:
${agentList}

Task: "${task}"

Return ONLY a JSON object with "reasoning" (short COT analysis) and "tasks" array.
Each task has: agentId, instruction, dependsOn (array of task indices this depends on, empty for first tasks).
Example:
{
  "reasoning": "This task requires implementing code then reviewing it.",
  "tasks": [
    { "agentId": "developer", "instruction": "Implement the function", "dependsOn": [] },
    { "agentId": "auditor", "instruction": "Review the implementation", "dependsOn": [0] }
  ]
}`;

    try {
      const resolved = registry.resolveModel(this.modelRef);
      const messages: AgentMessage[] = [
        { role: "system", content: "You are a technical project manager that creates task plans." },
        { role: "user", content: prompt },
      ];

      const result = await piHarness.send({
        modelRef: this.modelRef,
        providerId: resolved?.providerId || "",
        messages,
        tools: [],
        config: { sessionId: "orchestrator", runId: `plan_${Date.now()}` },
      });

      const text = (result as any).content ?? (result as any).text ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { reasoning: parsed.reasoning || "", tasks: parsed.tasks || [] };
      }
    } catch { /* fallback: single task for developer */ }

    return {
      reasoning: "Direct execution by developer.",
      tasks: [{ agentId: "developer", instruction: task, dependsOn: [] }],
    };
  }

  /**
   * Execute a task plan: run sub-agents respecting dependencies,
   * with automatic retry on failure.
   */
  async executePlan(plan: TaskPlan): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = [];

    for (let i = 0; i < plan.tasks.length; i++) {
      const task = plan.tasks[i];

      // Check dependencies
      if (task.dependsOn) {
        for (const depIdx of task.dependsOn) {
          if (!results[depIdx]) throw new Error(`Task ${i} depends on incomplete task ${depIdx}`);
          if (results[depIdx].error) {
            results.push({
              agentId: task.agentId,
              result: "",
              error: `Skipped: dependency ${depIdx} (${results[depIdx].agentId}) failed: ${results[depIdx].error}`,
              durationMs: 0,
            });
            continue;
          }
        }
      }

      const def = SUB_AGENTS.find((a) => a.id === task.agentId);
      if (!def) {
        results.push({ agentId: task.agentId, result: "", error: `Unknown sub-agent: ${task.agentId}`, durationMs: 0 });
        continue;
      }

      // Execute with retry
      let lastError: string | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await runSubAgent(def, attempt === 0 ? task.instruction : `${task.instruction}\n\nPrevious attempt failed: ${lastError}. Be more thorough.`, this.modelRef, this.signal);
        if (!r.error) { results.push(r); lastError = null; break; }
        lastError = r.error;
        if (attempt === 1) results.push(r);
      }
    }

    return results;
  }

  /**
   * Merge multiple sub-agent results into a coherent summary.
   */
  async mergeResults(results: SubAgentResult[], originalTask: string): Promise<string> {
    const hasErrors = results.some((r) => r.error);
    const parts = results.map(
      (r, i) => `## ${r.agentId}\n${r.error ? `**Error:** ${r.error}\n` : ""}\`\`\`\n${(r.result || r.error || "").slice(0, 4000)}\n\`\`\``,
    ).join("\n\n");

    const prompt = `Synthesize these sub-agent results for the user's task.

Original task: "${originalTask}"

Results:
${parts}

${hasErrors ? "Some agents failed. Mention what succeeded and what didn't.\n" : ""}
Provide a clear markdown summary. Include key code and findings.`;

    try {
      const resolved = registry.resolveModel(this.modelRef);
      const messages: AgentMessage[] = [
        { role: "system", content: "You synthesize multi-agent work into clear summaries." },
        { role: "user", content: prompt },
      ];

      const result = await piHarness.send({
        modelRef: this.modelRef,
        providerId: resolved?.providerId || "",
        messages,
        tools: [],
        config: { sessionId: "merge", runId: `merge_${Date.now()}` },
      });

      return ((result as any).content ?? (result as any).text ?? parts).trim();
    } catch {
      return parts;
    }
  }
}
