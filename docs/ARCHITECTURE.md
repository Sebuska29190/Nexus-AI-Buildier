# AgentForge Architecture

## Overview

AgentForge is a TypeScript/Bun monorepo AI agent platform. It follows a plugin-based architecture with a core engine that orchestrates agents, sessions, tools, and providers.

## Core Components

### 1. Agent System (`packages/core/src/agent/`)
- **`runner.ts`**: Agent execution loop with tool-calling (max 15 iterations), circuit breaker, quota enforcement
- **`store.ts`**: SQLite-backed agent storage with workspace files (AGENTS.md, SOUL.md, etc.)
- **`auto-bug-fixer.ts`**: Autonomous bug fixing agent (1:1 z CheetahClaws)

### 2. Session System (`packages/core/src/session/`)
- **`manager.ts`**: SQLite-backed sessions with transcripts table
- Auto-saves to Knowledge Base on session end

### 3. Plugin System (`packages/core/src/plugin/`)
- **`registry.ts`**: Provider and channel plugin registry
- **`loader.ts`**: Plugin discovery from packages directory
- **`tools.ts`**: Tool registry with built-in tools

### 4. Provider System (`packages/provider-*/`)
Each provider implements the `ProviderPlugin` interface:
- `id`, `name`, `models`, `auth`
- `stream()` — SSE streaming from LLM API
- `classifyError()` — Error classification
- `thinkingProfile()` — Optional reasoning support

8 providers: DeepSeek, Anthropic, OpenAI, Gemini, Ollama, Qwen, Grok, Custom

### 5. Kernel (`packages/core/src/kernel/`)
- **`agentfs.ts`**: Virtual file system for agents (private + shared global namespaces)
- **`ledger.ts`**: Immutable event log in JSONL format (one file per day)
- **`index.ts`**: Kernel initialization and orchestration

### 6. Workspace (`packages/core/src/workspace/`)
- **`manager.ts`**: User-selectable folder for agent file operations
- Read/write/create/delete/search/tree operations

## Data Flow

```
User Input → Agent Runner → Provider Stream → Tool Loop → Response
                ↓                ↓
          Session Store    Knowledge Base
                ↓                ↓
          SQLite DB       File System (YAML)
```

## Security

- JWT authentication
- Circuit breaker (per-provider)
- Quota system (per-session/per-day)
- Error classification
- Auth profiles with failure tracking
