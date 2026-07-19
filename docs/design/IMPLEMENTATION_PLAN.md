# 📅 Nexus AI v4.0 — Implementation Plan (Roadmap)

> 7 faz | ~48 dni roboczych | ~8-9 tygodni | 2-3 developerów frontend

---

## 📊 Podsumowanie Harmonogramu

```
Faza 0: Setup      ██░░░░░░░░░░░░░░░░░░   2 dni
Faza 1: Design     █████░░░░░░░░░░░░░░░░   5 dni
Faza 2: Core UI    █████████░░░░░░░░░░░░   7 dni
Faza 3: Layout     ██████████████░░░░░░░░   5 dni
Faza 4: Pages      ██████████████████████   14 dni
Faza 5: Advanced   ██████████████████████   10 dni
Faza 6: Polish     ██████████████████████   5 dni
─────────────────────────────────────────
Total:              ██████████████████████   48 dni
```

---

## 🔴 Faza 0: Setup & Foundation (2 dni)

> **Cel:** Przygotować projekt pod redesign, zainstalować wszystkie zależności

### Dzień 1: Dependencies + Struktura

```bash
# Instalacja podstawowych pakietów
npm install tailwindcss@^4 @tailwindcss/vite@^4
npm install framer-motion@^11 lucide-react@^0.450
npm install clsx@^2 tailwind-merge@^2 class-variance-authority@^0

# Radix primitives
npm install @radix-ui/react-slot @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-popover
npm install @radix-ui/react-tooltip @radix-ui/react-tabs
npm install @radix-ui/react-switch @radix-ui/react-checkbox
npm install @radix-ui/react-accordion @radix-ui/react-slider

# Notifications
npm install sonner@^1
```

### Dzień 2: Struktura projektu

```
packages/ui/src/
├── styles/
│   ├── globals.css          # Tailwind + custom properties
│   ├── tokens.css           # Design tokens
│   └── animations.css       # Framer motion variants
├── lib/
│   ├── utils.ts             # cn() from tailwind-merge + clsx
│   ├── motion.ts            # Motion token definitions
│   └── colors.ts            # Color palette helpers
├── hooks/
│   ├── useKeyboard.ts      # Keyboard shortcuts
│   ├── useMediaQuery.ts    # Responsive helpers
│   └── useTheme.ts         # Theme context
└── components/
    └── ui/                  # Base components (empty scaffolding)
```

**Deliverables:**
- ✅ Tailwind v4 config z custom colors
- ✅ `cn()` utility
- ✅ `globals.css` z wszystkimi CSS custom properties
- ✅ Struktura folderów

---

## 🟡 Faza 1: Design System Implementation (5 dni)

> **Cel:** Zbudować fundament wizualny — kolory, typografia, spacing, glassmorphism

### Dni 1-2: Design Tokens + Tailwind Config

```
✅ CSS Custom Properties w globals.css
✅ Tailwind config: colors, fonts, radius, shadows
✅ Glassmorphism utility classes
✅ Typography scale (Inter + JetBrains Mono)
```

### Dni 3-4: Motion System

```
✅ Framer motion shared variants (pageTransition, fadeIn, slideUp)
✅ AnimatePresence wrappers
✅ Spring animations config
✅ Micro-interactions: hover-lift, active-press
```

### Dzień 5: Theme Provider

```
✅ <ThemeProvider /> context
✅ Dark/Light/System toggle
✅ Accent color switcher (6 colors)
✅ localStorage persistence
```

**Deliverables:**
- ✅ `globals.css` — 150+ linii design tokens
- ✅ `ThemeProvider` z contextem
- ✅ Wszystkie glassmorphism klasy
- ✅ Framer motion wariacje

---

## 🟡 Faza 2: Core Components Library (7 dni)

> **Cel:** 20 podstawowych komponentów UI

### Dni 1-2: Button + Input System

```
✅ Button (6 variants: primary, secondary, ghost, destructive, outline, icon)
✅ Input with floating label
✅ Textarea with auto-resize
✅ Select with custom dropdown
✅ Switch, Checkbox, Radio
```

**Tailwind feedback dla Button:**
```tsx
<Button variant="primary"   className="bg-cyan-500 hover:bg-cyan-600 text-zinc-950" />
<Button variant="ghost"     className="hover:bg-zinc-800 text-zinc-300" />
<Button variant="destructive" className="bg-red-600/10 hover:bg-red-600/20 text-red-400" />
```

### Dni 3-4: Overlay Components

```
✅ Dialog/Modal z AnimatePresence
✅ Sheet (slide-over) — 4 directions
✅ Popover
✅ Dropdown Menu (z shortcuts)
✅ Tooltip
```

### Dni 5-6: Data Display

```
✅ Badge (status, priority, count)
✅ Avatar (initials, image, status dot)
✅ Progress Bar (linear + circular)
✅ Skeleton Loaders
✅ Empty State
```

### Dzień 7: Navigation + Feedback

```
✅ Tabs (underline + pills variants)
✅ Accordion
✅ Toast/Sonner integration
✅ Loading Spinner
✅ Breadcrumbs
```

**Deliverables:**
- ✅ 20+ komponentów w `packages/ui/src/components/ui/`
- ✅ Wszystkie z TypeScript + JSDoc
- ✅ Storie w Storybook (opcjonalnie)

---

## 🟡 Faza 3: Layout & Navigation (5 dni)

> **Cel:** Główny layout aplikacji — sidebar, command palette, theme

### Dni 1-2: Sidebar

```tsx
// Komponenty do zbudowania
<Sidebar expanded={true} onToggle={...}>
  <SidebarLogo />
  <SidebarNav>
    <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/" active />
    <SidebarItem icon={Bot} label="Agents" href="/agents" />
    <SidebarItem icon={MessageSquare} label="Chat" href="/chat" />
    <SidebarItem icon={Brain} label="Memory" href="/memory" />
    <SidebarItem icon={Terminal} label="Logs" href="/logs" />
    <SidebarSeparator />
    <SidebarItem icon={Puzzle} label="Plugins" href="/plugins" />
    <SidebarItem icon={Settings} label="Settings" href="/settings" />
  </SidebarNav>
  <SidebarFooter>
    <UserAvatar />
    <SidebarCollapseButton />
  </SidebarFooter>
</Sidebar>
```

**States:**
- Expanded: `w-56` z labelami
- Collapsed: `w-16` tylko ikony
- Hover (collapsed): expand na hover z opóźnieniem 200ms

### Dni 3: Top Bar

```
✅ Command palette trigger (Cmd+K)
✅ Breadcrumbs dynamiczne
✅ Quick actions (New, Run, Save)
✅ Notification bell z badge
✅ User menu
```

### Dni 4-5: Command Palette + Theme

```
✅ CommandPalette (cmdk@1.0) — pełna implementacja
✅ ThemeSwitcher
✅ Keyboard shortcuts modal (na ?)
✅ Layout provider (sidebar state, mobile responsiveness)
```

**Deliverables:**
- ✅ Sidebar z animacją collapse/expand
- ✅ Command palette (Cmd+K) z wyszukiwarką
- ✅ Theme switcher
- ✅ Layout context provider

---

## 🟠 Faza 4: Pages Redesign (14 dni)

> **Cel:** Przeprojektować 10 najważniejszych stron

### Dni 1-2: Dashboard (P0)

```
✅ KPI cards z sparkline charts
✅ Activity feed (real-time)
✅ Quick actions grid
✅ Top agents ranking
```

**Komponenty:** `DataCard`, `Sparkline`, `ActivityFeed`, `QuickActions`

### Dni 3-4: Agent Work View (P0)

```
✅ 3-pane resizable layout (files | chat | terminal)
✅ Monaco editor integration
✅ Chat panel z streamingiem
✅ Terminal (xterm.js)
```

**Komponenty:** `SplitPane`, `CodeEditor`, `Terminal`, `ChatBubble`, `StreamingText`

### Dni 5-6: Agents List (P0)

```
✅ Rich card layout
✅ Search + filters (status, model, tags)
✅ Multi-select + bulk actions
✅ Inline status indicators
```

**Komponenty:** `AgentCard`, `FilterBar`, `SearchInput`, `BulkActions`

### Dni 7-8: Chat Interface (P0)

```
✅ Code blocks z syntax highlighting + copy
✅ Regenerate + Branch buttons
✅ File attachments drag-n-drop
✅ Voice input
```

**Komponenty:** `MessageBubble`, `CodeBlock`, `VoiceInput`, `FileDropZone`

### Dni 9-10: Memory Explorer + Settings (P1)

```
Memory Explorer:
✅ Force-directed graph (react-force-graph-2d)
✅ Filter by type/tag
✅ Search
✅ Node click → detail panel

Settings:
✅ Left nav sections
✅ Diff preview przed zapisem
✅ Environmental variables editor
```

### Dni 11-12: Plugin Store + Logs (P1)

```
Plugin Store:
✅ Featured carousel
✅ Category tabs
✅ Install/uninstall flow
✅ Search + sort

Logs:
✅ Real-time streaming
✅ Log level filters
✅ Severity colors
```

### Dni 13-14: Workflow Builder + Analytics (P2)

```
Workflow Builder:
✅ Drag-n-drop DAG (reactflow)
✅ Node library
✅ Edge connections
✅ Test mode

Analytics:
✅ Charts (recharts)
✅ Time range selector
✅ Export
```

**Deliverables:**
- ✅ 10 przeprojektowanych stron
- ✅ Nowe komponenty dla każdej strony
- ✅ Responsywne layouty

---

## 🟠 Faza 5: Advanced Features (10 dni)

> **Cel:** Cutting-edge funkcjonalności

### Dni 1-2: Agent Runs Visualization (DAG/Timeline)

```
✅ DAG view dla workflow runs
✅ Timeline view dla agent executions
✅ Step-by-step replay
```

### Dni 3-4: Diff Viewer + Rich Markdown

```
✅ Code diff viewer (Monaco diff)
✅ Rich markdown preview (Mermaid, LaTeX)
✅ TOC generation
```

### Dni 5-6: Workflow Builder (Full)

```
✅ Node library sidebar
✅ Drag-n-drop DAG builder
✅ Config panel per node
✅ YAML export/import
```

### Dni 7-8: Drag-n-Drop + Virtualization

```
✅ Kanban board for tasks (dnd-kit)
✅ Sortable lists
✅ File upload zones
✅ Infinite scroll for logs/history
```

### Dni 9-10: Voice + Notifications (Full)

```
✅ Voice input integration
✅ Smart notifications
✅ Desktop push notifications
✅ Notification preferences panel
```

**Deliverables:**
- ✅ Agent runs DAG visualization
- ✅ Diff viewer
- ✅ Full workflow builder
- ✅ Voice input
- ✅ Smart notifications

---

## 🟢 Faza 6: Polish & Perfection (5 dni)

> **Cel:** Dopracowanie, accessibility, performance

### Dni 1-2: Animacje + Mikro-interakcje

```
✅ Page transitions (AnimatePresence)
✅ List item stagger animations
✅ Hover/active states na wszystkich elementach
✅ Loading states z skeletonami
✅ Empty states z ilustracjami
```

### Dni 3: Accessibility (WCAG 2.1 AA)

```
✅ Focus rings na wszystkich elementach
✅ ARIA labels
✅ Keyboard navigation audit
✅ Color contrast check
✅ Screen reader testing
✅ Reduced motion media query
```

### Dni 4: Performance

```
✅ Code splitting — lazy load pages
✅ Bundle analysis (vite-bundle-visualizer)
✅ Image optimization
✅ Virtual scrolling dla długich list
✅ Debounce search inputs
✅ Memo complex components
```

### Dni 5: Final QA + i18n Setup

```
✅ Cross-browser testing
✅ Mobile testing
✅ i18n infrastructure (i18next)
✅ EN + PL translation keys
✅ PWA manifest preparation
✅ Documentation update
```

**Deliverables:**
- ✅ WCAG 2.1 AA compliance
- ✅ Lighthouse score ≥ 95
- ✅ Bundle size < 300KB (gzip)
- ✅ Smooth 60fps animations

---

## 📊 Podsumowanie — Zasoby

| Faza | Dni | Developerzy | Kluczowe Ryzyko |
|------|-----|-------------|-----------------|
| Faza 0: Setup | 2 | 1 | Brak |
| Faza 1: Design | 5 | 1 | Decyzje kolorów |
| Faza 2: Core UI | 7 | 2 | Konsystencja API komponentów |
| Faza 3: Layout | 5 | 1-2 | Responsywność sidebaru |
| Faza 4: Pages | 14 | 2-3 | Największy scope |
| Faza 5: Advanced | 10 | 2 | Złożoność techniczna |
| Faza 6: Polish | 5 | 1-2 | Cross-browser issue |
| **Total** | **48 dni** | **2-3 FTEs** | |

### Alternatywny harmonogram (2 developerów)

```
Faza 0:       2 dni  (parallel)
Faza 1:       5 dni  (1 dev)
Faza 2:       7 dni  (2 devs, split components)
Faza 3:       5 dni  (2 devs)
Faza 4:       10 dni (2 devs, 5 stron/dev)
Faza 5:       8 dni  (2 devs, 5 dni każdy)
Faza 6:       4 dni  (2 devs)
────────────────────────────
Total:        41 dni  (przy 2 developerach)
```

### Zależności krytyczne

```
Design System (F1) → Components (F2) → Layout (F3) → Pages (F4)
                                ↓
                     Advanced (F5) — może być równoległy z F4
                     Polish (F6) — zawsze na końcu
```

---

*Implementation Plan v1.0 — 7 faz, 48 dni, 2-3 developerów | Szacunek: 8-9 tygodni kalendarzowych*
