import { sessionManager } from "../session/manager.ts";
import { piHarness } from "../harness/pi.ts";
import { registry } from "../plugin/registry.ts";
import { getTool, listTools } from "../plugin/tools.ts";
import { classifyToolRisk, requestApproval } from "../agent/approval.ts";
import { safety } from "../safety/circuit-breaker-tools.ts";
import type { AgentMessage } from "@nova/sdk";
import { OrchestratorAgent } from "./OrchestratorAgent.ts";
import { SUB_AGENTS } from "./sub-agents.ts";
import type { ChatEvent, TaskPlan } from "./types.ts";

const SUB_AGENT_CONTEXT = SUB_AGENTS.map(
  (a) => `- ${a.id}: ${a.description}. Tools: ${a.tools.join(", ")}`,
).join("\n");

/**
 * ChatSession — handles a single chat session with streaming,
 * tool execution, sub-agent delegation, and approval flow.
 */
export class ChatSession {
  private sessionId: string;
  private modelRef: string;
  private messages: AgentMessage[] = [];
  private orchestrator: OrchestratorAgent;
  private signal?: AbortSignal;

  constructor(params: {
    sessionId: string;
    modelRef: string;
    systemPrompt?: string;
    signal?: AbortSignal;
  }) {
    this.sessionId = params.sessionId;
    this.modelRef = params.modelRef;
    this.signal = params.signal;
    this.orchestrator = new OrchestratorAgent(params.modelRef, params.signal);

    if (params.systemPrompt) {
      this.messages.push({ role: "system", content: params.systemPrompt });
    }
  }

  /**
   * Process a user message and yield events as the agent works.
   * This is the main entry point — called from the WebSocket gateway.
   */
  async *processMessage(userMessage: string): AsyncGenerator<ChatEvent> {
    sessionManager.append(this.sessionId, "user", userMessage);

    // Add user message to context
    this.messages.push({ role: "user", content: userMessage });

    // Delegate to orchestrator for complex tasks, or run directly for simple ones
    const plan = await this.orchestrator.planTask(userMessage);

    if (plan.tasks.length > 1 || plan.tasks[0]?.agentId !== "developer") {
      // Multi-agent: delegate, then merge
      yield { type: "thinking", text: `🧠 Planning: ${plan.reasoning}` };

      for (const task of plan.tasks) {
        const def = SUB_AGENTS.find((a) => a.id === task.agentId);
        yield { type: "sub_agent_start", agentId: task.agentId, task: task.instruction };
      }

      const results = await this.orchestrator.executePlan(plan);

      for (const r of results) {
        if (r.error) yield { type: "sub_agent_error", agentId: r.agentId, error: r.error };
        else yield { type: "sub_agent_result", agentId: r.agentId, result: r.result.slice(0, 200) };
      }

      const merged = await this.orchestrator.mergeResults(results, userMessage);
      yield* this.streamText(merged);
    } else {
      // Direct execution (single agent)
      yield* this.runDirect(userMessage);
    }

    yield { type: "done", text: "" };
  }

  /**
   * Direct execution — used for simple tasks or as a fallback.
   * Calls the LLM with tool definitions and handles tool calls.
   */
  private async *runDirect(userMessage: string): AsyncGenerator<ChatEvent> {
    const resolved = registry.resolveModel(this.modelRef);
    if (!resolved) {
      yield { type: "error", message: `Model ${this.modelRef} not found` };
      return;
    }

    // Inject sub-agent context for the main agent
    const sysMsg = this.messages.find((m) => m.role === "system");
    if (sysMsg) {
      sysMsg.content += `\n\nYou have sub-agents available:\n${SUB_AGENT_CONTEXT}\nUse delegate(agentId, task) to delegate specialized work.`;
    }

    let iteration = 0;
    const MAX_ITER = 25;
    let fullText = "";

    while (iteration < MAX_ITER) {
      if (this.signal?.aborted) {
        yield { type: "error", message: "Cancelled" };
        return;
      }

      iteration++;

      // Get tool definitions
      const tools = listTools().map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      const result = await piHarness.send({
        modelRef: this.modelRef,
        providerId: resolved.providerId,
        messages: this.messages,
        tools,
        thinkingLevel: undefined,
        config: { sessionId: this.sessionId, runId: `run_${Date.now()}` },
      });

      const text = (result as any).content ?? (result as any).text ?? "";
      const toolCalls = (result as any).toolCalls ?? [];

      if (toolCalls.length > 0) {
        for (const tc of toolCalls) {
          const toolName = tc.function?.name ?? tc.name ?? "unknown";
          const toolArgs = typeof tc.function?.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function?.arguments ?? {};

          const riskLevel = classifyToolRisk(toolName);
          yield { type: "tool_call", tool: toolName, args: toolArgs, id: tc.id ?? `call_${iteration}` };

          if (riskLevel === "risky") {
            // Request approval
            yield { type: "approval_request", id: tc.id ?? `call_${iteration}`, tool: toolName, args: toolArgs };

            try {
              const approval = await requestApproval(
                tc.id ?? `call_${iteration}`,
                toolName,
                toolArgs,
                riskLevel,
                this.sessionId,
                false,
                true,
              );
              if (!approval.approved) {
                this.messages.push({
                  role: "tool",
                  content: `⚠️ ${toolName} was rejected by user.`,
                  tool_call_id: tc.id ?? `call_${iteration}`,
                });
                continue;
              }
            } catch {
              continue; // timeout or error, skip tool
            }
          }

          // Execute tool
          const toolFn = getTool(toolName);
          let toolResult = `❌ Tool "${toolName}" not found`;
          let success = false;
          if (toolFn) {
            try {
              toolResult = await toolFn.execute(toolArgs, { sessionId: this.sessionId });
              success = true;
            } catch (e: unknown) {
              toolResult = `❌ Error: ${e instanceof Error ? e.message : String(e)}`;
            }
          }

          yield { type: "tool_result", tool: toolName, result: toolResult.slice(0, 200), duration: 0 };

          this.messages.push({
            role: "assistant",
            content: `__TOOL_CALLS__${tc.id ?? toolName}`,
            tool_calls: [{
              id: tc.id ?? `call_${iteration}`,
              type: "function",
              function: { name: toolName, arguments: JSON.stringify(toolArgs) },
            }],
          });
          this.messages.push({
            role: "tool",
            content: toolResult,
            tool_call_id: tc.id ?? `call_${iteration}`,
          });

          // Handle sub-agent delegation
          if (toolName === "delegate") {
            const def = SUB_AGENTS.find((a) => a.id === toolArgs.agentId);
            if (def) {
              yield { type: "sub_agent_start", agentId: toolArgs.agentId, task: toolArgs.task };
              const subResult = await this.orchestrator["executePlan"]({
                reasoning: "",
                tasks: [{ agentId: toolArgs.agentId, instruction: toolArgs.task, dependsOn: [] }],
              });
              const r = subResult[0];
              if (r?.error) yield { type: "sub_agent_error", agentId: toolArgs.agentId, error: r.error };
              else if (r) yield { type: "sub_agent_result", agentId: toolArgs.agentId, result: r.result.slice(0, 200) };
            }
          }
        }
      } else if (text) {
        // No tool calls — stream the text response
        yield* this.streamText(text);
        fullText = text;

        // Check if we should continue
        if (iteration >= 3 || text.length > 100) break;
      } else {
        break;
      }
    }
  }

  /**
   * Stream text token by token (simulated — real streaming comes from harness).
   */
  private async *streamText(text: string): AsyncGenerator<ChatEvent> {
    if (!text) return;
    // Yield full text in chunks for realism
    const words = text.split(" ");
    let buffer = "";
    for (const word of words) {
      buffer += (buffer ? " " : "") + word;
      if (buffer.length >= 3) {
        yield { type: "token", text: buffer };
        buffer = "";
      }
    }
    if (buffer) yield { type: "token", text: buffer };
  }
}
