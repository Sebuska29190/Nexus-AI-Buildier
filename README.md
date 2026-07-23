<p align="center">
  <img src="assets/agentforge-logo.svg" width="80" alt="AgentForge">
</p>

<p align="center">
  <strong>AgentForge</strong> · Forge autonomous coding agents. Locally.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-F59E0B" alt="version">
  <img src="https://img.shields.io/badge/agents-129-EA580C" alt="agents">
  <img src="https://img.shields.io/badge/tools-66-71717A" alt="tools">
  <img src="https://img.shields.io/badge/providers-8-F59E0B" alt="providers">
  <img src="https://img.shields.io/badge/self--hosted-✓-10B981" alt="self-hosted">
</p>

---

## What is AgentForge?

**AgentForge** is a self-hosted, agent-first platform for forging autonomous coding agents. Audit code, review PRs, write tests, debug, refactor, secure, and deploy — all on your machine, with your API keys never leaving your hardware.

Built on **Bun + Hono + React 19 + SQLite**. 129 specialized agents with persistent memory, an Evidence Protocol that rejects reports without `file:line` proof, and a Learning Loop that auto-remediates agents that hallucinate.

### Why AgentForge?

> **Status:** 129 coding agents | 66 tools | 8 LLM providers | 200+ REST endpoints | 100% local

- **Coding-first** — agents for audit, review, test, debug, refactor, security, DevOps, not general chat
- **Self-hosted** — your keys, your data, your machine. No telemetry, no cloud
- **Evidence Protocol** — every claim validated against real tool output. No hallucinated reports
- **Learning Loop** — degraded agents get their prompts auto-corrected from failure patterns
- **Trust scoring** — 🟢 Verified → 🟡 Neutral → 🔴 Low → ⚠️ Degraded. Affects routing

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Sebuska29190/agentforge.git
cd agentforge

# 2. Install
bun install

# 3. Configure
cp .env.example .env
# Edit .env — add at least one API key (DeepSeek recommended)

# 4. Start
bun run dev

# 5. Open http://localhost:4123
```

---

## Coding Agents

126 specialized agents, organized by what they do to code:

| Category | Count | Examples |
|----------|-------|----------|
| **Native Forge** | 13 | auditor, auto-coder, code-reviewer, security-auditor, tester, auto-bug-fixer |
| **Core Development** | 11 | api-designer, backend-developer, frontend-developer, fullstack-developer, graphql-architect |
| **Language Specialists** | 30 | typescript-pro, python-pro, golang-pro, rust-engineer, java-architect, react-specialist |
| **Infrastructure** | 16 | kubernetes-specialist, docker-expert, terraform-engineer, cloud-architect, sre-engineer |
| **Quality & Security** | 17 | penetration-tester, chaos-engineer, compliance-auditor, performance-engineer, debugger |
| **Data & AI** | 13 | data-engineer, ml-engineer, llm-architect, prompt-engineer, postgres-pro |
| **Developer Experience** | 15 | refactoring-specialist, build-engineer, git-workflow-manager, mcp-developer |
| **Meta-Orchestration** | 11 | multi-agent-coordinator, workflow-orchestrator, task-distributor |

---

## Core System

### Evidence Protocol
Every agent report is validated. Claims without `file:line` references and actual tool output are **rejected**. Reports with <30% evidence get a strike. 3 strikes → agent is auto-remediated by the Learning Loop.

### Quality Scoring
Trust-based reputation per agent: 🟢 Verified → 🟡 Neutral → 🔴 Low → ⚠️ Degraded. Score affects routing priority.

### Smart Router
Type a task → system auto-selects the best agent based on capability matching (domains + languages + keywords). Trust multiplier adjusts scores.

### Learning Loop
Degraded agents get their system prompt auto-corrected based on failure pattern analysis. Corrections persist to `AGENTS.md`.

### Agent Work Viewer
Live SSE streaming of agent execution: tool calls, results, thinking, progress. Stop or steer agents mid-execution.

---

## Architecture

```
agentforge/
├── packages/
│   ├── core/src/                    # Server — Bun + Hono
│   │   ├── agent/                   # Agent lifecycle
│   │   │   ├── runner.ts            #   Agent execution loop
│   │   │   ├── scheduler.ts         #   Background job scheduler
│   │   │   ├── store.ts             #   Agent CRUD
│   │   │   ├── memory.ts            #   Persistent episodic + semantic memory
│   │   │   ├── validator.ts         #   Evidence Protocol — validates reports
│   │   │   ├── scoring.ts           #   Trust-based quality scoring
│   │   │   ├── router.ts            #   Smart Router — auto-select best agent
│   │   │   ├── learning.ts          #   Learning Loop — self-correcting prompts
│   │   │   └── community-agents.ts  #   125 agent definitions
│   │   ├── plugin/                  # 66 tools
│   │   ├── safety/                  # Circuit breaker + tool audit
│   │   ├── session/                 # FTS5 transcripts
│   │   ├── config/                  # AES-encrypted provider config
│   │   └── api/                     # 200+ REST endpoints
│   └── ui/                          # React 19 + Vite — 30+ pages
├── agents/                          # Agent definitions (AGENTS.md + SOUL.md + MEMORY.md)
├── skills/                          # Community skills
└── providers/                       # LLM provider plugins
```

---

## LLM Providers

| Provider | Models |
|----------|--------|
| **DeepSeek** | deepseek-chat, deepseek-coder |
| **OpenAI** | GPT-5, GPT-4o, o3-mini |
| **Anthropic** | Claude Opus 4, Sonnet 4 |
| **Google Gemini** | Gemini 2.5 Pro, 2.0 Flash |
| **xAI Grok** | grok-3, grok-3-mini |
| **Qwen** | Qwen-Plus, Qwen-Max, Qwen-Coder |
| **Ollama** | Any local model |
| **LM Studio** | Any local model |
| **Custom** | Any OpenAI-compatible endpoint |

---

## API Highlights

```bash
# Chat
POST /v1/chat/completions

# Agents
GET    /api/agents                    # List all 126 agents
POST   /api/agents/match              # Smart Router — find best agent for task
GET    /api/agents/:id/score          # Quality score + trust badge
GET    /api/agents/:id/learning       # Learning loop history
POST   /api/agents/:id/remediate      # Force remediation
GET    /api/agents/runs/:runId/events # Live SSE agent execution stream
POST   /api/agents/runs/:runId/steer  # Steer running agent
GET    /api/agents/runs/:runId/stop   # Stop running agent

# Memory
GET    /api/agents/:id/memory         # Agent's learned knowledge
POST   /api/agents/:id/learn          # Manually teach an agent
```

---

## Security

- ✅ `.env` and `data/` — gitignored, never committed
- ✅ API keys encrypted at rest (AES, derived from `NEXUS_ENCRYPTION_SECRET`)
- ✅ **Dangerous command blocking** — `rm -rf /`, `format`, `diskpart`, registry edits
- ✅ **Workspace path validation** — blocks system paths (`C:\Windows`, `/etc`)
- ✅ **Workspace isolation** — file operations constrained to root
- ✅ **Path traversal protection** — blocks `../` patterns
- ✅ **Circuit breaker** — loop detection, tool call limits, depth limits
- ✅ **Tool audit logging** — every tool call recorded
- ✅ No telemetry, no cloud dependency, 100% local

---

## License

MIT with Attribution — see [LICENSE](LICENSE).

---

> **Forge autonomous coding agents. Locally. — AgentForge v1.0**
