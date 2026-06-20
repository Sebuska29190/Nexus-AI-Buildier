export { ChatSession } from "./ChatSession.ts";
export { OrchestratorAgent } from "./OrchestratorAgent.ts";
export { SUB_AGENTS } from "./sub-agents.ts";
export { registerChatTools } from "./tools.ts";
export type { ChatEvent, TaskPlan, TaskPlanItem } from "./types.ts";

import { agentStore } from "../agent/store.ts";
import { SUB_AGENTS } from "./sub-agents.ts";

/**
 * Seed sub-agents into the agent store so they're available for delegation.
 */
export function seedSubAgents(): void {
  for (const def of SUB_AGENTS) {
    try {
      if (!agentStore.get(def.id)) {
        agentStore.create({
          id: def.id,
          name: def.name,
          description: def.description,
          modelRef: "deepseek/deepseek-chat",
          systemPrompt: def.systemPrompt,
        });
      }
    } catch { /* already exists */ }
  }
}
