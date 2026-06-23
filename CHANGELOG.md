# Changelog

## v4.0.0 (2026-06-23)

### 🔴 Removed (dead modules)
- **Chambers** — multi-agent teams removed (unstable)
- **Cron/Scheduler** — background job scheduler removed (buggy)
- **Workflows** — workflow engine removed (unstable)
- **Agent Mesh Protocol** — agent mesh removed (buggy)
- **Sub-agents** — sub-agent system removed (unstable)
- **JWT Auth** — authentication middleware removed (incomplete)
- **MCP** — Model Context Protocol removed (unstable)
- **Knowledge Base** — RAG knowledge base removed (stub, no-op)
- **Usage Tracker** — monitoring system removed (stub, no-op)
- **Kernel/AFS** — audit ledger removed (stub)
- **Worker Page** — UI without backend removed
- **All stub API endpoints** — now return 404 instead of pretending to work

### 🟡 Fixed
- **Bug: Non-streaming chat empty response** — `piResult.content` → `piResult.text` (HarnessResult uses `text` not `content`)
- **Bug: web_search always "No results found"** — DuckDuckGo Lite requires POST + browser User-Agent (GET with wrong regex)
- **Bug: Agent memory tools timeout** — fallback to sessionId when no agentId mapped + MAX_TOOL_ITERATIONS=25

### 🟢 UI Redesign
- **New Sidebar** — categories in Polish (PRACA, NARZĘDZIA, DANE, SYSTEM), new brand colors (#7C3AED + #06B6D4)
- **Dashboard** — new landing page with stats, quick agent grid, recent sessions, system health
- **Split-panel Chat** — thinking/response toggle, full thinking content view, enhanced Tool Timeline
- **Agent Config Hub** — list all agents, System Prompt editor, tool assignment view, quality score

### 🔵 Optimizations
- **Code splitting** — lazy-loaded all pages (main bundle: 696kB → 214kB, -69%)
- **Gzip compression** — API responses compressed (897kB → 217kB, -76%)
- **WebSocket heartbeat** — ping/pong every 30s with auto-reconnect (exponential backoff 1s→30s)
- **Dead code removed** — ~1,900 lines of stubs, references, and no-op modules removed

### 🧪 Testing
- **191 tests passing, 0 failing**
- Fixed 7 broken tests: router, tool-registry, circuit-breaker, skill-loader
