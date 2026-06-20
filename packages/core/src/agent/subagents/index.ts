/**
 * Sub-Agent System — Specialized workers under the Conductor
 * 
 * Each sub-agent has a specific role and toolset.
 * All sub-agents must be truthful — never lie about what they can or cannot do.
 */

import type { AgentMessage, ToolCall } from "@nova/sdk";
import { piHarness } from "../../harness/pi.ts";
import { registry } from "../../plugin/registry.ts";
import { getTool, listTools } from "../../plugin/tools.ts";
import { safeMessage } from "../../errors.ts";

// ─── Base Sub-Agent ─────────────────────────────────────────────────────────

export interface SubAgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  maxIterations: number;
}

export interface SubAgentTask {
  id: string;
  description: string;
  context?: string;
  modelRef: string;
  thinkingLevel?: string;
  signal?: AbortSignal;
}

export interface SubAgentResult {
  taskId: string;
  agentId: string;
  success: boolean;
  result: string;
  error?: string;
  usage: { input: number; output: number };
}

export class BaseSubAgent {
  protected config: SubAgentConfig;
  
  constructor(config: SubAgentConfig) {
    this.config = config;
  }
  
  /**
   * Execute a task — must be overridden by subclasses
   */
  async execute(task: SubAgentTask): Promise<SubAgentResult> {
    const messages: AgentMessage[] = [
      { role: "system", content: this.config.systemPrompt },
    ];
    
    // Add task context
    if (task.context) {
      messages.push({
        role: "system",
        content: `## Task Context\n${task.context}`,
      });
    }
    
    messages.push({
      role: "user",
      content: task.description,
    });
    
    // Get allowed tools
    const toolDefs = listTools()
      .filter(t => this.config.allowedTools.includes(t.name))
      .map(t => ({
        type: "function" as const,
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    
    const resolved = registry.resolveModel(task.modelRef);
    if (!resolved) {
      return {
        taskId: task.id,
        agentId: this.config.id,
        success: false,
        result: "",
        error: `Model ${task.modelRef} not found`,
        usage: { input: 0, output: 0 },
      };
    }
    
    const ctx = {
      modelRef: task.modelRef,
      providerId: resolved.providerId,
      messages,
      tools: toolDefs,
      thinkingLevel: task.thinkingLevel,
      signal: task.signal,
      config: { sessionId: task.id, runId: task.id },
    };
    
    await piHarness.prepare(ctx);
    await piHarness.start(ctx);
    
    let fullResponse = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let iteration = 0;
    
    try {
      while (iteration < this.config.maxIterations) {
        if (task.signal?.aborted) {
          break;
        }
        
        const llmResult = await piHarness.run(ctx);
        
        // Execute tool calls
        if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
          for (const toolCall of llmResult.toolCalls) {
            const tool = getTool(toolCall.name);
            if (!tool) {
              ctx.messages.push({
                role: "tool",
                content: `Tool ${toolCall.name} not available`,
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
          
          ctx.messages.push({
            role: "assistant",
            content: `Tool calls: ${llmResult.toolCalls.map((tc: any) => tc.name).join(", ")}`,
          });
          
          iteration++;
        } else {
          // Final response
          fullResponse = llmResult.text;
          inputTokens = llmResult.usage?.input ?? 0;
          outputTokens = llmResult.usage?.output ?? 0;
          break;
        }
      }
      
      return {
        taskId: task.id,
        agentId: this.config.id,
        success: true,
        result: fullResponse || "No response generated",
        usage: { input: inputTokens, output: outputTokens },
      };
    } catch (e: unknown) {
      return {
        taskId: task.id,
        agentId: this.config.id,
        success: false,
        result: "",
        error: safeMessage(e),
        usage: { input: 0, output: 0 },
      };
    }
  }
}

// ─── Senior Developer ───────────────────────────────────────────────────────

export class SeniorDevAgent extends BaseSubAgent {
  constructor() {
    super({
      id: "senior-dev",
      name: "Senior Developer",
      description: "Expert software engineer for coding, debugging, and architecture",
      systemPrompt: `You are a Senior Software Engineer — an expert in multiple programming languages and frameworks.

## Core Principles
1. **NEVER LIE** — If you don't know something, say "I don't know." Never make up information.
2. **Truthful by default** — Always provide accurate, verifiable information.
3. **Action over discussion** — When you can do something, do it immediately.
4. **Be thorough** — Read files before editing. Understand the code before changing it.

## What You Do
- Write clean, maintainable, well-documented code
- Debug complex issues systematically
- Design scalable architectures
- Refactor code for better performance and readability
- Write comprehensive tests
- Follow best practices and coding standards

## What You Don't Do
- Make up information or pretend to know something you don't
- Skip reading files before editing them
- Make assumptions without verification
- Introduce security vulnerabilities

## Response Format
- Be concise but thorough
- Always cite file:line references
- If you make a mistake, acknowledge it and correct yourself`,
      allowedTools: [
        "workspace_read_file",
        "workspace_write_file",
        "workspace_edit_file",
        "workspace_search_files",
        "workspace_run_command",
        "workspace_list_files",
        "web_fetch",
      ],
      maxIterations: 15,
    });
  }
}

// ─── Cyber-Auditor ──────────────────────────────────────────────────────────

export class CyberAuditorAgent extends BaseSubAgent {
  constructor() {
    super({
      id: "cyber-auditor",
      name: "Cyber-Auditor",
      description: "Security specialist for code auditing and vulnerability detection",
      systemPrompt: `You are a Cyber-Auditor — a security specialist who reviews code for vulnerabilities.

## Core Principles
1. **NEVER LIE** — If you find a vulnerability, report it accurately. If you're unsure, say "I'm not certain."
2. **Truthful by default** — Never exaggerate or minimize security issues.
3. **Thorough analysis** — Review code systematically for all vulnerability classes.
4. **Actionable recommendations** — Provide specific fix suggestions, not vague advice.

## What You Do
- Review code for security vulnerabilities (XSS, SQLi, SSRF, auth bypass, etc.)
- Identify insecure configurations and defaults
- Analyze authentication and authorization logic
- Review cryptographic implementations
- Check for sensitive data exposure
- Assess input validation and sanitization

## Vulnerability Classes to Check
- Injection (SQL, NoSQL, Command, LDAP)
- Broken Authentication
- Sensitive Data Exposure
- XML External Entity (XXE)
- Broken Access Control
- Security Misconfiguration
- Cross-Site Scripting (XSS)
- Insecure Deserialization
- Using Components with Known Vulnerabilities
- Insufficient Logging

## Response Format
- List each finding with severity (Critical/High/Medium/Low/Info)
- Provide file:line references for each finding
- Explain the impact and exploit scenario
- Suggest specific remediation steps
- If no vulnerabilities found, say so explicitly`,
      allowedTools: [
        "workspace_read_file",
        "workspace_search_files",
        "workspace_list_files",
        "workspace_run_command",
        "web_fetch",
      ],
      maxIterations: 20,
    });
  }
}

// ─── Web Researcher ─────────────────────────────────────────────────────────

export class WebResearcherAgent extends BaseSubAgent {
  constructor() {
    super({
      id: "web-researcher",
      name: "Web Researcher",
      description: "Technical researcher for documentation, APIs, and best practices",
      systemPrompt: `You are a Web Researcher — a technical researcher who finds accurate information.

## Core Principles
1. **NEVER LIE** — If you can't find information, say so. Never make up information.
2. **Truthful by default** — Always cite your sources.
3. **Thorough research** — Search multiple sources before drawing conclusions.
4. **Up-to-date information** — Always check for the latest versions and best practices.

## What You Do
- Research technical documentation and APIs
- Find best practices and design patterns
- Investigate library versions and compatibility
- Research security advisories and CVEs
- Find code examples and tutorials
- Verify information accuracy

## What You Don't Do
- Make up documentation or API references
- Provide outdated information without checking
- Skip source verification
- Present uncertain information as fact

## Response Format
- Always cite sources with URLs
- Include version numbers when relevant
- Clearly state when information is uncertain or outdated
- Provide actionable recommendations`,
      allowedTools: [
        "web_search",
        "web_fetch",
        "workspace_read_file",
        "workspace_list_files",
      ],
      maxIterations: 15,
    });
  }
}

// ─── API Connector ──────────────────────────────────────────────────────────

export class ApiConnectorAgent extends BaseSubAgent {
  constructor() {
    super({
      id: "api-connector",
      name: "API Connector",
      description: "Specialist for HTTP clients, API design, and data transformation",
      systemPrompt: `You are an API Connector — a specialist in API integration and data transformation.

## Core Principles
1. **NEVER LIE** — If an API doesn't work as expected, report it honestly.
2. **Truthful by default** — Always verify API behavior before claiming it works.
3. **Robust implementations** — Handle errors, timeouts, and edge cases.
4. **Security first** — Never expose secrets, always validate inputs.

## What You Do
- Design and implement RESTful and GraphQL APIs
- Create HTTP clients with proper error handling
- Transform data between formats (JSON, XML, CSV, etc.)
- Implement authentication (OAuth, JWT, API keys)
- Handle rate limiting and retries
- Write API documentation

## What You Don't Do
- Hardcode credentials or secrets
- Skip error handling
- Assume API behavior without testing
- Ignore security best practices

## Response Format
- Provide complete, working code examples
- Include error handling and edge cases
- Document API contracts and expected behavior
- Note any security considerations`,
      allowedTools: [
        "workspace_read_file",
        "workspace_write_file",
        "workspace_edit_file",
        "workspace_search_files",
        "workspace_run_command",
        "web_fetch",
        "web_search",
      ],
      maxIterations: 15,
    });
  }
}

// ─── Agent Registry ─────────────────────────────────────────────────────────

export const subAgents = new Map<string, BaseSubAgent>();

// Register all sub-agents
export function registerSubAgents(): void {
  subAgents.set("senior-dev", new SeniorDevAgent());
  subAgents.set("cyber-auditor", new CyberAuditorAgent());
  subAgents.set("web-researcher", new WebResearcherAgent());
  subAgents.set("api-connector", new ApiConnectorAgent());
}

// Initialize on import
registerSubAgents();

/**
 * Get a sub-agent by ID
 */
export function getSubAgent(id: string): BaseSubAgent | undefined {
  return subAgents.get(id);
}

/**
 * List all available sub-agents
 */
export function listSubAgents(): SubAgentConfig[] {
  return [...subAgents.values()].map(agent => ({
    id: agent["config"].id,
    name: agent["config"].name,
    description: agent["config"].description,
    systemPrompt: agent["config"].systemPrompt,
    allowedTools: agent["config"].allowedTools,
    maxIterations: agent["config"].maxIterations,
  }));
}
