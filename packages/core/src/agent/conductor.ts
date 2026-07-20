/**
 * Conductor Agent — Main Orchestrator
 * 
 * Analyzes user requests, decomposes into tasks, and routes to specialized sub-agents.
 * The conductor never lies — it always truthfully reports what it can and cannot do.
 */

import type { AgentMessage, ToolCall } from "@nova/sdk";
import { emitEvent } from "../event-bus/index.ts";
import { piHarness } from "../harness/pi.ts";
import { registry } from "../plugin/registry.ts";
import { getTool, listTools } from "../plugin/tools.ts";
import { sessionManager } from "../session/manager.ts";
import { maybeCompact } from "../compaction.ts";
import { workspaceManager } from "../workspace/manager.ts";
import { safeMessage } from "../errors.ts";
import { getBreaker } from "../circuit-breaker.ts";
import { classifyError } from "../error-classifier.ts";
import { checkQuota } from "../quota.ts";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConductorParams {
  sessionId: string;
  message: string;
  modelRef: string;
  thinkingLevel?: string;
  systemPrompt?: string;
  signal?: AbortSignal;
  runId?: string;
  agentId?: string;
}

export interface ConductorResult {
  sessionId: string;
  text: string;
  modelRef: string;
  usage: { input: number; output: number };
  subAgentResults?: SubAgentResult[];
}

export interface SubAgentResult {
  agentId: string;
  task: string;
  result: string;
  status: "success" | "error" | "timeout";
}

// ─── Task Classification ────────────────────────────────────────────────────

type TaskType = 
  | "simple_chat"      // Greetings, opinions, small talk
  | "code_task"        // Read/write/edit code
  | "security_review"  // Audit, security scan
  | "research"         // Documentation, best practices
  | "api_integration"  // HTTP, API, data transformation
  | "complex_task";    // Multi-step, needs decomposition

function classifyTask(message: string): TaskType {
  const lower = message.toLowerCase().trim();
  
  // Very short = simple chat
  if (lower.length < 15) return "simple_chat";
  
  // Simple chat indicators
  const chatPatterns = /^(hi|hello|hey|cześć|witaj|siema|thanks|dzięki|ok|yes|no|tak|nie|good|great|nice|cool|super|excellent|perfect)\b/i;
  if (chatPatterns.test(lower)) return "simple_chat";
  
  // Security review
  const securityPatterns = /\b(audit|security|vulnerability|exploit|xss|ssrf|sql.?inject|auth.?bypass|security.?review|penetration|pentest)\b/i;
  if (securityPatterns.test(lower)) return "security_review";
  
  // Research
  const researchPatterns = /\b(research|document|reference|explain|how.?does.?work|best.?practice|pattern|architecture|design.?pattern)\b/i;
  if (researchPatterns.test(lower)) return "research";
  
  // API integration
  const apiPatterns = /\b(api|http|fetch|endpoint|rest|graphql|webhook|integration|connector|oauth|jwt|token)\b/i;
  if (apiPatterns.test(lower)) return "api_integration";
  
  // Code task
  const codePatterns = /\b(read|write|edit|create|fix|bug|error|test|build|deploy|refactor|implement|add|remove|delete|update|check|analyze|search|find|scan|review|optimize|migrate|install|configure|setup|debug|trace|profile|benchmark)\b/i;
  if (codePatterns.test(lower)) return "code_task";
  
  // File/code references
  const filePattern = /\b(src\/|lib\/|test\/|\.ts|\.js|\.py|\.rs|\.go|\.tsx|\.jsx|function |class |const |import |export |async |await |return )\b/i;
  if (filePattern.test(lower)) return "code_task";
  
  // Complex task (long messages with multiple indicators)
  if (lower.length > 50) return "complex_task";
  
  return "simple_chat";
}

// ─── System Prompt Builder ──────────────────────────────────────────────────

const CONDUCTOR_SYSTEM_PROMPT = `You are AgentForge — an autonomous AI coding agent. You are an expert software engineer who helps users with coding, debugging, architecture, and security.

## Core Principles
1. **NEVER LIE** — If you don't know something, say "I don't know." If you can't do something, say "I can't do that." Never make up information or pretend to have done something you haven't.
2. **Truthful by default** — Always provide accurate, verifiable information. If you're uncertain, express your uncertainty.
3. **Action over discussion** — When you can do something, do it immediately. Don't just talk about it.
4. **Be thorough** — Read files before editing them. Understand the codebase before making changes.

## What You Can Do
- Read, write, edit, and create code files
- Run terminal commands (build, test, lint, etc.)
- Search codebases for patterns, functions, errors
- Analyze code for bugs, security issues, performance problems
- Design architecture and refactor code
- Write and run tests

## What You Cannot Do (be honest)
- Access the internet (except web_search and web_fetch tools)
- Execute code in production environments
- Access databases directly
- Deploy applications
- Remember things across sessions (you start fresh each time)

## Response Format
- Be concise but thorough
- Always cite file:line references when discussing code
- If you make a mistake, acknowledge it and correct yourself
- If you're unsure about something, say "I'm not certain about this, but..."

## Tool Usage
- Use tools IMMEDIATELY when needed
- Don't narrate routine calls (read, search, list)
- Only narrate when it helps: complex decisions, unexpected results, strategy changes
- One sentence max for narration. No paragraphs.`;

const SUBAGENT_SYSTEM_PROMPT = `You are a specialized sub-agent working under the Conductor's direction. You must:
1. **NEVER LIE** — If you can't do something, say so honestly.
2. Complete your assigned task thoroughly and accurately
3. Report results with specific file:line references
4. If you encounter an error, report it honestly — don't hide it
5. Do NOT make assumptions — verify everything with tools`;

// ─── Conductor Class ────────────────────────────────────────────────────────

export class Conductor {
  private maxSubAgents = 5;
  private maxIterations = 20;

  /**
   * Main entry point — analyze task, route to sub-agents or handle directly
   */
  async run(params: ConductorParams): Promise<ConductorResult> {
    const session = sessionManager.getSession(params.sessionId);
    const taskType = classifyTask(params.message);
    
    // Simple chat — instant reply, no tools needed
    if (taskType === "simple_chat") {
      return this.handleSimpleChat(params);
    }
    
    // Complex tasks — decompose and route to sub-agents
    if (taskType === "complex_task" || taskType === "security_review" || taskType === "research" || taskType === "api_integration") {
      return this.handleComplexTask(params, taskType);
    }
    
    // Code tasks — handle directly with tools
    return this.handleCodeTask(params);
  }

  /**
   * Simple chat — instant reply without tools
   */
  private async handleSimpleChat(params: ConductorParams): Promise<ConductorResult> {
    const messages: AgentMessage[] = [
      { role: "system", content: CONDUCTOR_SYSTEM_PROMPT },
      { role: "user", content: params.message },
    ];
    
    const resolved = registry.resolveModel(params.modelRef);
    if (!resolved) {
      return {
        sessionId: params.sessionId,
        text: `Error: Model ${params.modelRef} not found`,
        modelRef: params.modelRef,
        usage: { input: 0, output: 0 },
      };
    }
    
    const ctx = {
      modelRef: params.modelRef,
      providerId: resolved.providerId,
      messages,
      tools: [],
      thinkingLevel: params.thinkingLevel,
      signal: params.signal,
      config: { sessionId: params.sessionId, runId: params.runId },
    };
    
    await piHarness.prepare(ctx);
    await piHarness.start(ctx);
    
    try {
      const result = await piHarness.run(ctx);
      return {
        sessionId: params.sessionId,
        text: result.text,
        modelRef: params.modelRef,
        usage: result.usage ?? { input: 0, output: 0 },
      };
    } catch (e: unknown) {
      return {
        sessionId: params.sessionId,
        text: `Error: ${safeMessage(e)}`,
        modelRef: params.modelRef,
        usage: { input: 0, output: 0 },
      };
    }
  }

  /**
   * Code task — handle directly with tools
   */
  private async handleCodeTask(params: ConductorParams): Promise<ConductorResult> {
    const session = sessionManager.getSession(params.sessionId);
    const messages: AgentMessage[] = [
      { role: "system", content: CONDUCTOR_SYSTEM_PROMPT },
    ];
    
    // Add global rules
    const globalRules = this.loadGlobalRules();
    if (globalRules) {
      messages.push({ role: "system", content: globalRules });
    }
    
    // Add date/time
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    messages.push({
      role: "system",
      content: `## Current Date & Time\nToday is **${dateStr}**, current time is **${timeStr}**.`,
    });
    
    // Add workspace context
    try {
      if (!workspaceManager.isActive()) {
        workspaceManager.setRoot(process.cwd());
      }
    } catch {}
    
    // Add transcript
    const transcript = sessionManager.getTranscript(params.sessionId);
    for (const entry of transcript) {
      if (entry.role === "system") continue;
      messages.push({ role: entry.role as "user" | "assistant", content: entry.content });
    }
    
    messages.push({ role: "user", content: params.message });
    sessionManager.append(params.sessionId, "user", params.message);
    
    // Get coding tools
    const toolDefs = listTools()
      .filter(t => ["workspace_read_file", "workspace_write_file", "workspace_edit_file", "workspace_search_files", "workspace_run_command", "workspace_list_files", "web_fetch", "web_search"].includes(t.name))
      .map(t => ({
        type: "function" as const,
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    
    const resolved = registry.resolveModel(params.modelRef);
    if (!resolved) {
      return {
        sessionId: params.sessionId,
        text: `Error: Model ${params.modelRef} not found`,
        modelRef: params.modelRef,
        usage: { input: 0, output: 0 },
      };
    }
    
    const ctx = {
      modelRef: params.modelRef,
      providerId: resolved.providerId,
      messages,
      tools: toolDefs,
      thinkingLevel: params.thinkingLevel,
      signal: params.signal,
      config: { sessionId: params.sessionId, runId: params.runId },
    };
    
    await piHarness.prepare(ctx);
    await piHarness.start(ctx);
    
    try {
      // Tool loop
      let fullResponse = "";
      let inputTokens = 0;
      let outputTokens = 0;
      let iteration = 0;
      
      while (iteration < this.maxIterations) {
        if (params.signal?.aborted) {
          break;
        }
        
        // Force exit at iteration 15
        if (iteration >= 15) {
          ctx.tools = [];
          ctx.messages.push({
            role: "system",
            content: "All tools removed. You MUST produce your final answer NOW.",
          });
        }
        
        const llmResult = await piHarness.run(ctx);
        
        // Execute tool calls
        if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
          for (const toolCall of llmResult.toolCalls) {
            const tool = getTool(toolCall.name);
            if (!tool) {
              ctx.messages.push({
                role: "tool",
                content: `Tool ${toolCall.name} not found`,
              });
              continue;
            }
            
            try {
              const result = await tool.execute(toolCall.arguments, {});
              ctx.messages.push({
                role: "tool",
                content: typeof result === "string" ? result : JSON.stringify(result),
              });
            } catch (e: unknown) {
              ctx.messages.push({
                role: "tool",
                content: `Error: ${safeMessage(e)}`,
              });
            }
          }
          
          // Add assistant message with tool calls
          ctx.messages.push({
            role: "assistant",
            content: `Tool calls: ${llmResult.toolCalls.map((tc: any) => tc.name).join(", ")}`,
          });
          
          iteration++;
        } else {
          // No tool calls — this is the final response
          fullResponse = llmResult.text;
          inputTokens = llmResult.usage?.input ?? 0;
          outputTokens = llmResult.usage?.output ?? 0;
          break;
        }
      }
      
      return {
        sessionId: params.sessionId,
        text: fullResponse || "No response generated",
        modelRef: params.modelRef,
        usage: { input: inputTokens, output: outputTokens },
      };
    } catch (e: unknown) {
      return {
        sessionId: params.sessionId,
        text: `Error: ${safeMessage(e)}`,
        modelRef: params.modelRef,
        usage: { input: 0, output: 0 },
      };
    }
  }

  /**
   * Complex task — decompose and route to sub-agents
   */
  private async handleComplexTask(params: ConductorParams, taskType: TaskType): Promise<ConductorResult> {
    // For now, handle complex tasks directly
    // TODO: Implement sub-agent spawning
    return this.handleCodeTask(params);
  }

  /**
   * Load global rules from config/rules.txt
   */
  private loadGlobalRules(): string {
    try {
      const rulesPath = join(process.cwd(), "config", "rules.txt");
      if (existsSync(rulesPath)) {
        return readFileSync(rulesPath, "utf-8").trim();
      }
    } catch {}
    return "";
  }
}

// Singleton
export const conductor = new Conductor();
