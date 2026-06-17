# Nova AI Builder — Architecture Knowledge

## Project Overview
Nova AI Builder is a self-hosted AI agent platform for coding and development.
- **Version:** v0.8.0 (branded as "Nova AI AGENT BUILDER")
- **Author:** cheetahclaws (Sebuska29190)
- **License:** MIT with Attribution

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Runtime | Bun ≥ 1.1.0 |
| Backend | Hono (HTTP framework) on port 4123 |
| Frontend | React 19 + Vite 6.4 + Tailwind 4.3 on port 5173 |
| Language | TypeScript 5.9.3 throughout |
| Database | SQLite + FTS5 (full-text search) |
| Build | Bun workspace monorepo |
| Styling | Dark Glassmorphism (#6366f1/#8b5cf6) |
| Charts | Recharts |
| Workflow | React Flow (@xyflow/react) |

## Directory Structure
```
packages/
├── core/src/           # Backend (~100+ TypeScript files)
│   ├── api/routes.ts   # 100+ API endpoints (monolith ~2500 lines)
│   ├── agent/          # Agent runner, memory, store, scheduler
│   ├── plugin/         # Tool registry, community plugins
│   ├── rag/            # RAG with FTS5 + optional embeddings
│   ├── git/            # Git automation (11 tools)
│   ├── memory/         # Knowledge graph, memory store
│   ├── workspace/      # File system operations
│   ├── browser/        # Stealth browser automation
│   ├── session/        # SQLite + FTS5 session management
│   └── skill/          # Skill loader, self-improve
├── ui/src/             # React SPA (25+ pages)
│   ├── routes/         # Page components
│   ├── lib/components/ # Glass UI components
│   └── lib/hooks/      # Custom hooks (wallet, etc.)
└── sdk/                # Type definitions
```

## Sidebar Navigation Groups
1. **AI Agents** — Chat, Agents, Chambers, Knowledge Graph, RAG
2. **Development** — Code Editor, Git Automation, Terminal, Workspace, Workflows
3. **Tools & Skills** — Skills, Plugins, Integrations, Worker, Prompt Playground
4. **Data** — Sessions, Channels, Memory
5. **Configuration** — Settings, API Keys, Logs, Profiles, Models, Cron, Analytics, Docs

## API Endpoint Groups
- `/api/agent/*` — Agent CRUD, send, memory
- `/api/rag/*` — Document upload (with dedup), query, hybrid search
- `/api/kg/*` — Knowledge graph extract, entity, graph
- `/api/git/*` — 11 git automation endpoints
- `/api/workspace/*` — File tree, read, write
- `/api/sessions/*` — Session management, FTS5 search
- `/api/plugins/*` — Plugin install, uninstall, config
- `/api/integrations/*` — 30+ service integrations
- `/api/strategies/*` — Trading strategy CRUD (simulation mode)
- `/api/analytics/*` — Usage stats, cost tracking

## Glass UI Components
Location: `packages/ui/src/lib/components/ui/`
- GlassCard, GlassButton, GlassInput, GlassBadge
- GlassDropdown, GlassTabs, GlassTable
- MetricCard, AnimatedIcon

## Key Patterns
- **Tool registration:** `registerTool({ name, description, parameters, execute })` in plugin/tools.ts
- **Manager pattern:** Class with SQLite backend, singleton export
- **Event bus:** `emitEvent()` / `onEvent()` for WebSocket updates
- **Safety:** Circuit breakers, tool audit, dangerous command blocking

## Environment Variables
### Required
- `DEEPSEEK_API_KEY` — LLM ($0.14/1M tokens)
- `ETHERSCAN_API_KEY` — whale tracking

### Optional
- `ONEINCH_API_KEY` — DEX swap
- `RELAY_API_KEY` — bridge
- `SOLANA_PRIVATE_KEY` — wallet connect
- `REOWN_PROJECT_ID` — WalletConnect
- `OPENAI_API_KEY` — AI analysis fallback

## RAG System
- SQLite FTS5 for keyword search
- Optional OpenAI embeddings for semantic search (hybrid mode)
- Deduplication: filename check with cached Set (60s TTL)
- Pagination: 100 docs per page, search filter
- Bulk upload: 10 parallel requests, batch processing
- Supported formats: .txt, .md, .pdf, .csv, .json, .xml, .html
