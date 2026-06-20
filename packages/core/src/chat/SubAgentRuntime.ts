import { sessionManager } from "../session/manager.ts";
import { piHarness } from "../harness/pi.ts";
import { registry } from "../plugin/registry.ts";
import type { AgentMessage } from "@nova/sdk";
import type { SubAgentDef } from "./sub-agents.ts";

export interface SubAgentResult {
  agentId: string;
  result: string;
  error?: string;
  durationMs: number;
}

/**
 * Execute a sub-agent task in an isolated session with its own system prompt
 * and limited tool set. Returns the result text.
 */
export async function runSubAgent(
  def: SubAgentDef,
  userMessage: string,
  modelRef = "deepseek/deepseek-chat",
  signal?: AbortSignal,
): Promise<SubAgentResult> {
  const startTime = Date.now();
  const session = sessionManager.createSession(modelRef, { systemPrompt: def.systemPrompt });

  try {
    sessionManager.append(session.id, "user", userMessage);

    const resolved = registry.resolveModel(modelRef);
    if (!resolved) throw new Error(`Model ${modelRef} not found`);

    const messages: AgentMessage[] = [
      { role: "system", content: def.systemPrompt },
      { role: "user", content: userMessage },
    ];

    const result = await piHarness.send({
      modelRef,
      providerId: resolved.providerId,
      messages,
      tools: [],
      thinkingLevel: undefined,
      config: { sessionId: session.id, runId: `sub_${def.id}_${Date.now()}` },
    });

    const text = (result as any).content ?? (result as any).text ?? "";
    const durationMs = Date.now() - startTime;
    return { agentId: def.id, result: text, durationMs };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    return { agentId: def.id, result: "", error, durationMs: Date.now() - startTime };
  }
}

/**
 * Run multiple sub-agents in parallel, collecting results.
 */
export async function runSubAgentsParallel(
  agents: Array<{ def: SubAgentDef; message: string }>,
  modelRef?: string,
  signal?: AbortSignal,
): Promise<SubAgentResult[]> {
  const promises = agents.map((a) => runSubAgent(a.def, a.message, modelRef, signal));
  return Promise.all(promises);
}
