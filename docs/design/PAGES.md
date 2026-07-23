# 📄 AgentForge v4.0 — Pages Redesign

> 30+ stron | Pełny redesign | Inspiracje: Linear, Vercel, Cursor, Anthropic, GitHub

---

## Legenda

| Symbol | Znaczenie |
|--------|-----------|
| 🔴 **P0** | Must-have — główny workflow |
| 🟡 **P1** | High priority — daily use |
| 🟢 **P2** | Medium — ważne ale nie krytyczne |
| ⚪ **P3** | Nice-to-have |

---

## 1. 🔴 Dashboard (`/`) — Centralny Hub

**Obecny stan:** Standardowy dark dashboard z kartkami statystyk, tabelkami agentów, brak hierarchy.

**Nowy design — inspiruje się:** **Linear** (KPI dashboard) + **Vercel** (activity)

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search agents...                      [🔔] [👤] [⚙️]   │
├─────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │ 126  │ │ 89%  │ │ 1.2M │ │ 43ms │ │ $842 │              │
│ │Agents│ │Success│ │Tokens│ │Avg RT│ │Cost  │              │
│ │ ▲ +3 │ │ ▲ +2%│ │▁▂▃▅▇│ │▁▃▄▆▇│ │▁▂▃▅▇│              │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘              │
├─────────────────────────────────┬───────────────────────────┤
│ 📊 Activity Feed                │ 🚀 Quick Actions          │
│                                 │                           │
│ 08:32 — Agent "code-review"     │ [+ New Agent]             │
│   ✓ Completed — 12s             │ [Deploy All]              │
│ 08:31 — Agent "data-pipeline"   │ [⚡ Run Workflow]         │
│   ⚠ Warning — 45s              │ [📝 New Session]          │
│ 08:29 — Agent "deploy-bot"      │                           │
│   ✗ Failed — timeout           │ ┌─────────────────────┐   │
│ 08:28 — Agent "test-runner"     │ │ Top Agents by Runs  │   │
│   ✓ Completed — 3s              │ │ 1. code-review 1.2k │   │
│                                 │ │ 2. data-pipe    892 │   │
│ [View all activity →]           │ │ 3. test-suite    567│   │
│                                 │ └─────────────────────┘   │
└─────────────────────────────────┴───────────────────────────┘
```

**Nowe funkcjonalności:**
- Sparkline charts dla każdego KPI (`recharts` mini area charts)
- Activity feed — real-time stream agent events
- Quick actions — „New Agent", „Run Workflow", „New Session"
- Top agents ranking
- Status podsumowania: online/offline/error
- Command palette trigger (Cmd+K)

---

## 2. 🔴 Agent Work View (`/agents/:id/work`) — Główne okno pracy

**Obecny stan:** Prosty podział na chat + panel boczny, brak rich visualizacji.

**Nowy design — inspiruje się:** **Cursor** (split-pane editor) + **VSCode** (multi-panel)

```
┌──────────────────────────────────────────────────────────────┐
│ [Agent: code-helper]  ● Running  [🔁] [⏸] [⏹] [⚙️]      │
├──────────────────────┬───────────────────────────────────────┤
│ 📂 Files              │ 💬 Chat with Agent                    │
│ ┌──────────────────┐  │ ┌───────────────────────────────────┐│
│ │ src/             │  │ │ You: Refactor this function        ││
│ │ ├── components/  │  │ │ ┌─────────────────────────────┐   ││
│ │ │   ├── Button.ts│  │ │ │ def process(data):          │   ││
│ │ │   ├── Card.tsx │  │ │ │     for item in data:       │   ││
│ │ │   └── Modal.tsx│  │ │ │         ...                 │   ││
│ │ ├── utils/       │  │ │ └─────────────────────────────┘   ││
│ │ └── App.tsx      │  │ │ 📋 Suggestion: use map instead    ││
│ └──────────────────┘  │ │                                    ││
│                       │ │ Agent typing... ●●○               ││
│                       │ │                                    ││
│                       │ │ [Type your message...] [Send]      ││
│                       │ └───────────────────────────────────┘│
├───────────────────────┴───────────────────────────────────────┤
│ 🖥️ Terminal Output              📊 Agent Status               │
│ ┌──────────────────────────┐   ┌──────────────────────────┐   │
│ │ $ npm run build          │   │ Model: gpt-4o           │   │
│ │ ✓ Build complete (2.4s)  │   │ Tokens: 1,234/4,096     │   │
│ │ ✓ Tests passed (42/42)   │   │ Temperature: 0.7        │   │
│ │ ✗ Lint warnings (3)      │   │ Tools: search, code,     │   │
│ └──────────────────────────┘   │        web, file        │   │
│                                └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Resizable split panes (3-pane layout: files | chat | terminal)
- Live streaming agent output (Server-Sent Events)
- Inline code editing z Monaco
- Diff view przed/po zmianach agenta
- Status bar: model, tokens, temperature, tools active

---

## 3. 🔴 Agents List (`/agents`) — Zarządzanie agentami

**Obecny stan:** Prosta tabelka z nazwą i statusem.

**Nowy design — inspiruje się:** **GitHub** (rich cards + filters)

```
┌──────────────────────────────────────────────────────────────┐
│ Agents                    [+ New Agent] [Import] [⚙️]       │
├──────────────────────────────────────────────────────────────┤
│ [🔍 Search by name, model, tag...]     [All] [Active] [Idle] │
│ [Status ▼] [Model ▼] [Tags ▼] [Sort: Last run ▼]            │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🤖 code-helper        ● Online   ⚡ 1.2k runs today      │ │
│ │ GPT-4o · Tools: 4 · Tags: code, review, frontend        │ │
│ │ ████████████████░░░░ 78% success · Last: 2min ago       │ │
│ │ [▶ Run] [📝 Chat] [⚙️ Config] [⋮]                      │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 🤖 data-pipeline      ● Busy     ⚡ 892 runs            │ │
│ │ Claude 3.5 · Tools: 6 · Tags: data, etl, analytics      │ │
│ │ ████████████████████░ 92% success · Last: 30s ago       │ │
│ │ [▶ Run] [📝 Chat] [⚙️ Config] [⋮]                      │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 🤖 deploy-bot         ○ Idle     ⚡ 567 runs            │ │
│ │ GPT-4o-mini · Tools: 3 · Tags: deploy, devops, ci       │ │
│ │ ██████████████░░░░░░░ 65% success · Last: 1h ago        │ │
│ │ [▶ Run] [📝 Chat] [⚙️ Config] [⋮]                      │ │
│ └──────────────────────────────────────────────────────────┘ │
│ Showing 3 of 126 agents                    [← Prev] [1] [2] │
└──────────────────────────────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Rich card layout: avatar (generated), name, model, tags, status dot
- Progress bar success rate
- Quick actions: Run, Chat, Config, More
- Multi-select + bulk actions
- Virtual scrolling dla 126+ agentów

---

## 4. 🔴 Chat Interface (`/chat/:id`) — Rozmowa z agentem

**Obecny stan:** Podstawowe chat-bubbles, brak rich features.

**Nowy design — inspiruje się:** **Claude** + **ChatGPT** (clean bubbles, code blocks, branches)

```
┌──────────────────────────────────────────────────────────────┐
│ 💬 Session: "Refactor auth module"     [👤 Profile] [⚙️]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ You: Can you refactor the auth module?            │       │
│  │ 📎 auth.ts · auth.test.ts                         │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│         ┌─────────────────────────────────────┐              │
│         │ 🤖 agent · 2.3s · ⚡ 456 tokens    │              │
│         │ Here's the refactored auth module:  │              │
│         │ ┌─────────────────────────────────┐ │              │
│         │ │ import { hash, compare } from  │ │              │
│         │ │ 'bcrypt';                       │ │              │
│         │ │                                 │ │              │
│         │ │ export class AuthService {      │ │              │
│         │ │   async login(creds) { ... }   │ │              │
│         │ │ }                               │ │              │
│         │ └─────────────────────────────────┘ │              │
│         │ [📋 Copy] [🔄 Regenerate] [🔀 Branch] [📊 Diff] │
│         └─────────────────────────────────────┘              │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ You: Add rate limiting                           │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│         ┌─────────────────────────────────────────┐          │
│         │ ⏳ Agent is thinking... ●●○              │          │
│         └─────────────────────────────────────────┘          │
│                                                              │
│ ┌──────────────────────────────────────────────────┐         │
│ │ [Type your message...]       [📎] [🎤] [📤]    │         │
│ └──────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Code blocks z syntax highlighting + copy button
- Regenerate, Branch conversation
- Diff view — show changes between versions
- File attachments (drag-n-drop)
- Voice input (Web Speech API)
- Token counter per message
- Streaming response z typing indicator

---

## 5. 🟡 Memory Explorer (`/memory`) — Agent Memory Graph

**Obecny stan:** Textowa lista memory entries.

**Nowy design — inspiruje się:** **Obsidian** (knowledge graph) + **Notion** (database)

```
┌──────────────────────────────────────────────────────────────┐
│ 🧠 Memory Explorer           [🔍 Search] [Filter] [⚙️]     │
├──────────────────────┬───────────────────────────────────────┤
│ 📋 View as: [Graph] │                                       │
│                      │       ╭──────────╮                   │
│ 📂 Collections       │      ╱ agent-123  ╲                  │
│ ├── User Preferences │     │  code-review  │                │
│ ├── Project Context  │     ╲     │       ╱                  │
│ ├── Agent States     │       ╰────│──────╯                  │
│ └── Tool Results     │            │                          │
│                      │     ╭──────▼──────╮                  │
│ 🏷️ Tags              │    ╱  user-john    ╲                 │
│ ├── code-review      │   │   "prefers TS"   │               │
│ ├── architecture     │   ╲                ╱                 │
│ ├── deployment       │    ╰──────────────╯                  │
│ └── testing          │            │                          │
│                      │     ╭──────▼──────╮                  │
│                      │    ╱   project-42   ╲                 │
│                      │   │   "Nexus v4.0"   │               │
│                      │   ╲                ╱                 │
│                      │    ╰──────────────╯                  │
│                      │            │                          │
│                      │     ╭──────▼──────╮                  │
│                      │    ╱     tool-7     ╲                 │
│                      │   │   "github-api"   │               │
│                      │   ╲                ╱                 │
│                      │    ╰──────────────╯                  │
└──────────────────────┴───────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Force-directed graph visualization
- Click node → details panel
- Filter by type, tag, date
- Search with full-text
- Timeline slider: zobacz jak memory ewoluowała w czasie

---

## 6. 🟡 Settings (`/settings`) — Panel konfiguracji

**Obecny stan:** Standardowy formularz z sidebar tabs.

**Nowy design — inspiruje się:** **Vercel** (project settings) z diff preview

```
┌──────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                [Save] [Cancel]  │
├──────────┬───────────────────────────────────────────────────┤
│ General  │ ┌───────────────────────────────────────────────┐ │
│ API Keys │ │ 🤖 Default Model                              │ │
│ Agents   │ │ [gpt-4o                          ▼]           │ │
│ Tools    │ │                                               │ │
│ Plugins  │ │ 🌡️ Temperature                                │ │
│ Memory   │ │ [══════●═══════════════════] 0.7              │ │
│ Team     │ │                                               │ │
│ Billing  │ │ 🔗 Allowed Origins                             │ │
│ Security │ │ [http://localhost:5173               ]        │ │
│ Network  │ │ [https://app.nexus.dev               ]        │ │
│          │ │ [+ Add origin]                               │ │
│          │ │                                               │ │
│          │ │ 📦 Max Tokens per Response                    │ │
│          │ │ [4096                          ▼]             │ │
│          │ │                                               │ │
│          │ │ ┌────────────────────────────────────────┐    │ │
│          │ │ │ ⚠ Unsaved changes (2)                  │    │ │
│          │ │ │ [Review diff] [Discard]  [Save]        │    │ │
│          │ │ └────────────────────────────────────────┘    │ │
│          │ └───────────────────────────────────────────────┘ │
└──────────┴───────────────────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Diff preview — zobacz co się zmieni przed zapisem
- Section collapsible groups
- Search settings (Cmd+K scope)
- API key masking + reveal
- Experimental features toggle
- Environment variables editor

---

## 7. 🟡 Plugin Store (`/plugins`) — Marketplace

**Obecny stan:** Lista pluginów w tabelce.

**Nowy design — inspiruje się:** **VS Code Marketplace**

```
┌──────────────────────────────────────────────────────────────┐
│ 🧩 Plugin Store              [🔍 Search plugins...] [My Plugins] │
├──────────────────────────────────────────────────────────────┤
│ [Featured] [Tools] [Data] [UI] [Security] [All]             │
├──────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │Featured│ │Most   │ │New   │ │Top   │                        │
│ │       │ │Popular│ │This  │ │Rated │                        │
│ └──────┘ └──────┘ └──────┘ └──────┘                        │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ⭐ GitHub Integration            [Install] [★ 128]      │ │
│ │ Browse repos, create PRs, review code via agents         │ │
│ │ By: Nexus Team · v2.4.1 · 12.5k installs                │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 🔍 Web Search Tool               [Install] [★ 94]       │ │
│ │ Real-time web search with page scraping                  │ │
│ │ By: Community · v1.8.0 · 8.2k installs                  │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 📊 Data Analyzer                 [Installed ✓] [★ 67]  │ │
│ │ CSV, JSON, SQL analysis with agent                       │ │
│ │ By: Nexus Team · v3.0.2 · 4.1k installs                │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Featured carousel
- Category tabs
- Search + filter by category, rating, installs
- Install count + rating stars
- One-click install with status indicator
- Plugin detail sheet (slide-over)

---

## 8. 🟡 Logs / Terminal (`/logs`) — Logs & Monitoring

**Obecny stan:** Plain text log viewer.

**Nowy design — inspiruje się:** **Vercel Deployments** (streaming + filters)

```
┌──────────────────────────────────────────────────────────────┐
│ 📋 Logs & Terminal              [🔍 Filter] [⚙️] [🔄]     │
├──────────────────────────────────────────────────────────────┤
│ ⌛ Stream: ● Live  [Pause]  [Clear]  [Export]               │
│ [All levels ▼] [All agents ▼] [Last hour ▼]                 │
├──────────────────────────────────────────────────────────────┤
│ 14:32:05.123  INFO   code-helper  ✓ Agent initialized       │
│ 14:32:05.456  DEBUG  code-helper  └ Loaded config.json      │
│ 14:32:06.001  INFO   code-helper  → Processing request #42  │
│ 14:32:06.234  WARN   code-helper  ⚠ Rate limit: 85/100     │
│ 14:32:06.890  ERROR  code-helper  ✗ API timeout after 30s   │
│ 14:32:07.123  INFO   code-helper  ↻ Retrying (1/3)...       │
│ 14:32:08.456  INFO   data-pipe    ✓ Pipeline completed       │
│ 14:32:09.001  DEBUG  data-pipe    └ Rows processed: 12,432  │
│ 14:32:09.567  INFO   deploy-bot   → Deploying to staging    │
│ 14:32:10.234  INFO   deploy-bot   ✓ Build: 42s · 12 assets  │
│ 14:32:10.890  ERROR  test-runner  ✗ Test failed: auth.test  │
│ 14:32:11.456  INFO   test-runner  ↻ Retrying...             │
├──────────────────────────────────────────────────────────────┤
│ Showing 12 of 2,847 lines                       [Auto-scroll▼] │
└──────────────────────────────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Real-time streaming (WebSocket/SSE)
- ANSI color support
- Filters: level, agent, time range
- Severity color coding (green/yellow/red)
- Search with highlight
- Pause/Resume auto-scroll
- Export to JSON/CSV

---

## 9. 🟢 Workflow Builder (`/workflows`) — DAG Builder

**Obecny stan:** Brak — workflowy konfigurowane w kodzie YAML.

**Nowy design — inspiruje się:** **n8n** + **React Flow** (drag-n-drop DAG)

```
┌──────────────────────────────────────────────────────────────┐
│ 🔗 Workflow Builder: "Data Pipeline"     [Save] [▶ Run]    │
├──────────┬───────────────────────────────────────────────────┤
│ 🧩 Nodes │                                                   │
│          │  ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│ Input    │  │  Fetch    │───→│ Process  │───→│  Store   │    │
│ ├── HTTP │  │  GitHub   │    │  Data    │    │   DB     │    │
│ ├── Webhook│  API       │    │          │    │          │    │
│ ├── File  │  └──────────┘    └──────────┘    └──────────┘    │
│ ├── Cron  │       │               │                           │
│ Process  │       ▼               ▼                           │
│ ├── Transform│  ┌──────────┐    ┌──────────┐                 │
│ ├── Filter   │  │  Notify  │    │  Archive │                 │
│ ├── Analyze  │  │  Slack   │    │   S3     │                 │
│ └── Validate │  └──────────┘    └──────────┘                 │
│ Output       │                                               │
│ ├── Database │  ▼ Legend: ●=success  ⚠=warning  ✗=error     │
│ ├── API      │                                               │
│ ├── Email    │                                               │
│ └── Slack    │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Drag-n-drop node placement
- Edge connections (click-drag between nodes)
- Node config panel (click node → edit)
- Test run with step-by-step execution
- Execution history + DAG replay
- Template gallery

---

## 10. 🟢 Analytics (`/analytics`) — Data Dashboard

**Obecny stan:** Brak dedykowanego analytics panelu.

**Nowy design — inspiruje się:** **Vercel Analytics** + **PostHog**

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 Analytics                  [7d ▼] [All agents ▼] [Export] │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📈 Token Usage (last 7 days)                             │ │
│ │  ▁▂▃▅▇▆▄  Total: 1.2M · Avg: 171k/day · ▲ 12%         │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐               │ │
│ │ 1,234      │ │ 89.2%      │ │ $842.50    │               │ │
│ │ Total Runs │ │ Success    │ │ Cost       │               │ │
│ │ ▲ +8.3%   │ │ ▲ +2.1%   │ │ ▲ +5.7%   │               │ │
│ └────────────┘ └────────────┘ └────────────┘               │ │
│ ┌────────────────┬────────────────────────────────────────┐ │ │
│ │ Models         │ Usage by Model                         │ │ │
│ │ ● GPT-4o  45%  │ ████████████████████░░░░░░░░░░░░░░    │ │ │
│ │ ● Claude 30%   │ ██████████████░░░░░░░░░░░░░░░░░░░░    │ │ │
│ │ ● Gemini 15%   │ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │ │ │
│ │ ● Other  10%   │ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │ │ │
│ └────────────────┴────────────────────────────────────────┘ │ │
└──────────────────────────────────────────────────────────────┘
```

**Nowe funkcjonalności:**
- Time range selector (24h, 7d, 30d, custom)
- Token usage chart (area, stacked by model)
- Cost breakdown per agent/model
- Success rate over time
- Top agents by usage
- Export as PNG/CSV

---

## 11-15. 🟢 Pozostałe strony — skrócony opis

| # | Strona | Inspiracja | Nowy Design |
|---|--------|-----------|-------------|
| 11 | **Agent Config** (`/agents/:id/config`) | Linear project settings | Sidebar form z JSON/YAML editor, env vars, tool selection toggle |
| 12 | **Tools Manager** (`/tools`) | GitHub integrations | Card grid: name, description, auth status, enable/disable toggle |
| 13 | **Sessions History** (`/sessions`) | Linear issue list | Rich list: timestamp, agent, duration, tokens, status, tags, search |
| 14 | **API Keys** (`/settings/api-keys`) | Vercel API keys | Key reveal/mask, last used, permissions scope, create with one-click |
| 15 | **Billing** (`/settings/billing`) | Vercel billing | Usage bar, plan comparison, invoice history, payment method card |

---

## 16-20. ⚪ Dodatkowe strony

| # | Strona | Inspiracja | Opis |
|---|--------|-----------|------|
| 16 | **Team Members** (`/team`) | Linear team | Avatars, roles, permissions, invite modal |
| 17 | **Notifications** (`/notifications`) | GitHub notifications | Read/unread, grouped by agent, mark all read, sound preview |
| 18 | **Agent Templates** (`/templates`) | Vercel templates | Gallery grid, categories, one-click create, import/export |
| 19 | **Onboarding** (`/welcome`) | Linear onboarding | Step wizard: "Connect API key" → "Create first agent" → "Run workflow" |
| 20 | **Help & Docs** (`/help`) | Notion-style | Searchable docs, keyboard shortcuts reference, changelog, API ref |
| 21 | **Profile** (`/settings/profile`) | GitHub profile | Avatar, name, email, preferences, session management |
| 22 | **Agent Runs** (`/agents/:id/runs`) | Vercel deployments | List of past runs with status, duration, input/output preview, replay button |
| 23 | **Agent Logs** (`/agents/:id/logs`) | Railway logs | Scoped logs per agent, streaming, severity colors, search |
| 24 | **Tool Config** (`/tools/:id/config`) | Linear integrations | OAuth setup, scope configuration, test connection button |
| 25 | **Webhooks** (`/settings/webhooks`) | GitHub webhooks | URL, events list, last delivery, secret, test ping |
| 26 | **Rate Limits** (`/settings/rate-limits`) | OpenAI dashboard | Usage bars per endpoint, reset time, burst/steady limits |
| 27 | **Agent Comparison** (`/agents/compare`) | Linear compare | Side-by-side: config, performance, cost, tools |
| 28 | **Scheduled Tasks** (`/schedule`) | Cron-job.org | List of cron jobs, last run, next run, enable/disable, log link |
| 29 | **Secrets Vault** (`/settings/secrets`) | Vercel environment | Key-value editor, masked values, environment scope (dev/staging/prod) |
| 30 | **User Preferences** (`/settings/preferences`) | VS Code settings | Theme, language, editor preferences, notification settings, keybindings |

---

## Layout Framework

```
┌──────────────────────────────────────────────────────────────┐
│ 📌 Top Bar (Command Palette Trigger + Breadcrumbs + Actions)  │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                    │
│ 🔵 Left  │            📄 Main Content Area                   │
│   Sidebar │                                                    │
│          │                                                    │
│  • Dashboard│                                                    │
│  • Agents │                                                    │
│  • Chat   │                                                    │
│  • Memory │                                                    │
│  • Logs   │                                                    │
│  • Tools  │                                                    │
│  • Settings│                                                    │
│          │                                                    │
│ ──────── │                                                    │
│          │                                                    │
│ 🧩 Plugins│                                                    │
│          │                                                    │
│ [⚙️]     │                                                    │
└──────────┴───────────────────────────────────────────────────┘
```

**Sidebar** — `w-56` (collapsed: `w-16`), glassmorphism, icon + label, active indicator (cyan bar + glow)

---

*Pages Redesign v1.0 — 30 stron | 4 poziomy priorytetu | Rozpisane wireframe'y ASCII*
