# 🚀 Nexus AI v4.0 — Nowe Funkcjonalności 2026

> 20+ cutting-edge features | Keyboard-first | Collaborative | AI-native

---

## Priorytetyzacja

| Priorytet | Opis |
|-----------|------|
| **🔴 P0** | Krytyczne dla UX — must-have |
| **🟡 P1** | Wysoka wartość — daily driver |
| **🟢 P2** | Enhancement — znacząco podnosi jakość |
| **⚪ P3** | Future — roadmap po v4.0 |

---

## 🔴 1. Command Palette (Cmd+K) — Global Search + Actions

> Inspiracja: **Raycast** + **Linear command menu**

```tsx
// cmdk@1.0 + custom Nexus styling
// <CommandPalette />
```

**Trigger:** `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux)

**Funkcje:**
- 🔍 Search all pages, agents, tools, sessions
- ⚡ Quick actions: "Deploy agent", "Run workflow", "New session"
- 📋 Recent items — ostatnio używane agenty/strony
- ⌨️ Keyboard shortcuts — każdy item ma przypisany skrót
- 🧠 AI-powered search — fuzzy match na nazwach + opisach
- 🔢 Numeric shortcuts — `Cmd+1...9` dla szybkiej nawigacji

**UI:**
```
┌──────────────────────────────────────────────┐
│ ⌨️  Search agents, pages, commands...       │
├──────────────────────────────────────────────┤
│ Pages                                        │
│  ⌘1  Dashboard     > KPI overview           │
│  ⌘2  Agents        > All 126 agents         │
│  ⌘3  Chat          > Active sessions        │
│  ───────────────────────────────────────     │
│ Agents                                       │
│  ▶  code-helper    > GPT-4o · Online        │
│  ▶  data-pipeline  > Claude · Busy          │
│  ▶  deploy-bot     > GPT-4o-mini · Idle     │
│  ───────────────────────────────────────     │
│ Actions                                      │
│  ⌘⇧N  New Agent     > Create from template  │
│  ⌘⇧D  Deploy All    > Deploy all agents     │
│  ⌘⇧R  Run Workflow  > Select workflow       │
└──────────────────────────────────────────────┘
```

**Tailwind:** `bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl max-w-xl`

---

## 🔴 2. Keyboard-first UX — Vim-like Navigation

> Inspiracja: **Linear** + **Vim** (modal editing for navigation)

**Tryby:**
- `Normal mode` — nawigacja (j/k, h/l, gg, G)
- `Command mode` — `:` + nazwa strony
- `Visual mode` — zaznaczanie wielu agentów

**Keybindings:**
```
Navigation:
  j/k      → Move down/up in lists
  h/l      → Collapse/expand sidebar
  gg/G     → Top/bottom of page
  gd       → Go to dashboard
  ga       → Go to agents list
  gc       → Go to chat
  /        → Search on current page

Actions:
  n        → New (agent, session, workflow)
  dd       → Delete selected
  yy       → Copy selected
  p        → Paste / activate
  .        → Repeat last action
  u        → Undo
  <Esc>    → Back / close panel
  ?        → Show keyboard shortcuts help
```

**Implementation:** `react-hotkeys-hook` + custom hook `useNexusKeyboard`

---

## 🔴 3. Agent Runs Visualization — DAG / Timeline

> Inspiracja: **Linear workflow runs** + **Temporal.io UI**

**DAG View:**
```
Agent: data-pipeline · Run #892 · 45.2s
┌──────────────────────────────────────────────┐
│  Fetch    ──→  Transform  ──→  Validate      │
│  ● 2.1s         ● 12.3s        ● 3.4s        │
│   │               │              │            │
│   │               ▼              │            │
│   │           Analyze ──→ Store               │
│   │           ● 8.7s      ● 4.2s              │
│   │                              │            │
│   └──────────────────────────────┘            │
│                          Notify               │
│                          ● 1.2s               │
└──────────────────────────────────────────────┘
```

**Timeline View:**
```
14:32:05 ─── Agent initialized ─── ●
14:32:06 ─── Fetching data ──── ●●●●
14:32:10 ─── Processing ─────── ●●●●●●●●
14:32:18 ─── Validation ─────── ●●
14:32:20 ─── Storing results ── ●
14:32:21 ─── Notifying ──────── ●
14:32:22 ─── ✓ Completed ─────── ●
```

**Library:** `reactflow@11` (DAG) + custom timeline component

---

## 🟡 4. Real-time Collaboration (Future)

> Inspiracja: **Figma multiplayer** + **Linear live cursors**

**Funkcje (v4.1+):**
- Multiplayer cursors z nazwą użytkownika
- Live presence — kto ogląda ten sam agent/config
- Shared sessions — dwóch userów czatuje z tym samym agentem
- Conflict resolution — last-write-wins + history

**Implementation:** `yjs` (CRDT) + WebSocket

---

## 🟡 5. Diff Viewer — Code Changes

> Inspiracja: **GitHub diff** + **VS Code merge editor**

```tsx
// <DiffViewer oldCode={original} newCode={modified} language="typescript" />
```

```
┌──────────────────────────────────────────────┐
│ 📊 Diff: auth.ts                    [Accept] │
├──────────────────────────────────────────────┤
│  - import { oldImpl } from '...'            │
│  + import { newImpl } from '...'            │
│                                             │
│  - function login(user, pass) {             │
│  -   const hash = bcrypt.hash(pass);        │
│  -   return db.query(hash);                 │
│  + async function login(creds: Credentials) {│
│  +   const hash = await bcrypt.hash(...);   │
│  +   return this.db.findUser(hash);         │
│                                             │
│  [📋 Copy Diff] [🔄 Regenerate] [✅ Apply] │
└──────────────────────────────────────────────┘
```

**Library:** `react-diff-viewer-continued@4` lub Monaco Diff Editor

---

## 🟡 6. Rich Markdown Preview

> Inspiracja: **Notion** + **Obsidian** (live preview)

**Features:**
- WYSIWYG markdown editing w chat (slash commands `/`)
- Table of contents generation
- Mermaid diagram rendering (` ```mermaid `)
- LaTeX math rendering (` $$...$$ `)
- Image preview (drag-n-drop)
- File attachments z preview

**Library:** `react-markdown@9` + `remark-gfm` + `rehype-highlight` + `react-mermaid2`

---

## 🟡 7. Voice Input — Web Speech API

> Inspiracja: **ChatGPT Voice** + **Whisper**

```tsx
// <VoiceInput onTranscript={(text) => sendMessage(text)} />
```

**UI:**
```
┌──────────────────────────────────────┐
│ [Type your message...]   [🎤] [📤] │
└──────────────────────────────────────┘
         ↓ Click mic
┌──────────────────────────────────────┐
│ 🎤 Listening... ⬤⬤⬤⬤               │
│ "Refactor the auth module to use     │
│  async/await instead of callbacks"   │
│ [⏹ Stop] [✕ Cancel]                │
└──────────────────────────────────────┘
```

**API:** `webkitSpeechRecognition` / Web Speech API

---

## 🟡 8. Drag-n-Drop File Upload

> Inspiracja: **ChatGPT file upload** + **Linear attachments**

```tsx
// <FileDropZone accept={['.ts','.js','.py','.json','.md']} maxFiles={10} />
```

**Features:**
- Drag zone z animacją (border glow, scale)
- Multi-file upload (max 10 files, 25MB each)
- Progress bar per file
- File preview (image, code, JSON)
- Drop anywhere na stronie (global drop zone)

---

## 🟡 9. Smart Notifications

> Inspiracja: **Linear notifications** + **macOS notifications**

| Type | Visual | Sound | Desktop |
|------|--------|-------|---------|
| Agent completed | ✅ Toast | Subtle chime | ✅ |
| Agent failed | ❌ Toast + badge | Error tone | ✅ |
| Rate limit warning | ⚠️ Toast | Soft beep | ❌ |
| Daily report | 📊 Summary toast | — | ❌ |
| New version | 🎉 Toast | — | ❌ |

**Library:** `sonner@1.5` + `Notification API`

---

## 🟡 10. Multi-Pane Workspace

> Inspiracja: **VSCode** + **Arc Browser** (spaces)

```tsx
// <WorkspaceLayout panes={['chat', 'terminal', 'files', 'graph']} />
```

**Features:**
- 2-4 resizable panes
- Preset layouts: "Dev" (code + terminal), "Chat" (chat + files), "Monitor" (logs + graph)
- Save layout per user
- Drag panes to reorder
- Collapse pane to icon

**Library:** `react-resizable-panels@2`

---

## 🟢 11. Theme Switcher

> Inspiracja: **VS Code** + **Linear**

```tsx
// <ThemeSwitcher themes={['dark', 'light', 'system']} accent={['cyan', 'violet', 'green', 'orange']} />
```

- Dark / Light / System
- 6 accent colors: Cyan, Violet, Green, Orange, Rose, Blue
- Per-theme customization
- Persisted in localStorage + preferences API
- Smooth transition (`transition-colors duration-300`)

---

## 🟢 12. Agent Marketplace

> Inspiracja: **VS Code Marketplace** + **Docker Hub**

- Community-shared agents (YAML/JSON export)
- Categories: Code, Data, DevOps, Security, Writing
- Ratings + reviews
- One-click install
- Version history

---

## 🟢 13. Workflow Builder (DnD)

> Inspiracja: **n8n** + **Make.com**

- Drag-n-drop DAG builder (opisany w PAGES.md)
- Node library sidebar
- Edge connection z kliknięcia
- JSON/YAML export/import
- Test mode (step-by-step)

**Library:** `reactflow@11`

---

## 🟢 14. Analytics Dashboard

> Inspiracja: **Vercel Analytics** + **PostHog**

- Usage over time (tokens, runs, cost)
- Model distribution pie chart
- Success rate vs. time
- Top agents ranking
- Export CSV/PNG
- Time range selector

---

## 🟢 15. Mobile Responsive

> Inspiracja: **Linear mobile** + **GitHub mobile**

**Mobile breakpoints:**
- Bottom navigation bar (5 icons)
- Collapsed sidebar → slide-over
- Full-screen modals
- Touch-optimized targets (min 44px)
- Swipe gestures (back, delete)

---

## 🟢 16. PWA — Progressive Web App

> Inspiracja: **Twitter PWA** + **Spotify PWA**

- `manifest.json` with icons
- Service worker for offline cache
- `beforeinstallprompt` handling
- Offline fallback page
- Push notifications

---

## 🟢 17. i18n — Internationalization

```typescript
// Supported locales
const locales = ['en', 'pl', 'ua', 'de', 'fr', 'es'] as const;
```

**Library:** `react-i18next` + `i18next`

- Auto-detect browser locale
- Lazy-loaded translation files
- RTL support preparation
- Number/date formatting per locale

---

## 🟢 18. Accessibility — WCAG 2.1 AA

- Semantic HTML (nav, main, section, article)
- ARIA labels na wszystkich interactive
- Keyboard navigation (Tab, Enter, Escape)
- Focus trap in modals
- Color contrast ≥ 4.5:1
- Reduced motion media query
- Screen reader announcements
- Focus indicator (custom ring)

---

## ⚪ 19. Haptic Feedback (Mobile)

> `navigator.vibrate()` dla touch interactions

- Button press → `vibrate(10)`
- Error → `vibrate([30, 50, 30])`
- Success → `vibrate(15)`
- Drag start/end → `vibrate(20)`

---

## ⚪ 20. AI Assistant w UI — Meta-Agent

> Inspiracja: **Claude Artifacts** + **GitHub Copilot Chat**

**Funkcje:**
- Na-boardingu guide: "Create your first agent"
- Contextual help: "Need help? Click here or press ?"
- Smart suggestions: "You have 3 idle agents — want to pause them?"
- UI generation: "Create a custom dashboard widget"
- Error explanations: "This workflow failed because..."

---

## Podsumowanie — Priority Matrix

| Priority | Features | Estimate |
|----------|----------|----------|
| 🔴 P0 | Cmd+K, Keyboard-first, Agent Runs Viz | 3 tygodnie |
| 🟡 P1 | Diff Viewer, Voice, DnD Upload, Notifications, Multi-pane | 4 tygodnie |
| 🟢 P2 | Theme, Marketplace, Workflow Builder, Analytics, Mobile | 4 tygodnie |
| ⚪ P3 | PWA, i18n, a11y, Haptic, Meta-Agent | 3 tygodnie |
| **Total** | **20 features** | **~14 tygodni** |

---

*Features v1.0 — 20 funkcji | 4 poziomy priorytetu | Oparte o najlepsze praktyki 2026*
