# 🧩 Nexus AI v4.0 — Components Library

> 40+ komponentów UI | shadcn/ui style | Radix primitives | Fully typed TypeScript

---

## 📋 Legenda

| Ikona | Znaczenie |
|-------|-----------|
| ✅ | Core — must-have do MVP |
| ⭐ | Enhanced — rozszerza UX |
| 🚀 | Advanced — cutting-edge |
| 🔮 | Future — kolejne iteracje |

---

## 1. 🔘 Button — 6 variantów

```tsx
// <Button variant="primary|secondary|ghost|destructive|outline|icon" size="sm|md|lg">
```

| Variant | Tailwind Classes | Use Case |
|---------|-----------------|----------|
| **primary** | `bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-medium` | Główna akcja |
| **secondary** | `bg-zinc-800 hover:bg-zinc-700 text-zinc-100` | Alternatywna |
| **ghost** | `hover:bg-zinc-800/50 text-zinc-300` | Toolbar, listy |
| **destructive** | `bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20` | Delete |
| **outline** | `border border-zinc-700 hover:bg-zinc-800/50 text-zinc-300` | Secondary CTA |
| **icon** | `w-8 h-8 p-1.5 rounded-md hover:bg-zinc-800` | Toolbar actions |

**✅ Core | dependency: `class-variance-authority`, `@radix-ui/react-slot`**

---

## 2. ⌨️ Input / Textarea / Select — Floating Labels

```tsx
// <Input label="API Key" placeholder="sk-..." />
// <Textarea label="System Prompt" rows={4} />
// <Select label="Model" options={[...]} />
```

### Input States

| State | Tailwind |
|-------|----------|
| Default | `bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500` |
| Focus | `border-cyan-500/50 ring-1 ring-cyan-500/20` |
| Error | `border-red-500/50 ring-1 ring-red-500/20` |
| Disabled | `opacity-50 cursor-not-allowed bg-zinc-900/50` |
| Floating Label | `absolute -top-2.5 left-3 px-1 text-[11px] text-zinc-500 bg-zinc-950` |

**✅ Core | Floating label: absolute positioning + scale transform**

---

## 3. 🪟 Dialog / Modal

```tsx
// <Dialog open={open} onClose={setOpen}>
//   <Dialog.Content title="..." description="..." />
//   <Dialog.Footer>
//     <Button variant="ghost">Cancel</Button>
//     <Button>Confirm</Button>
//   </Dialog.Footer>
// </Dialog>
```

| Element | Tailwind Classes |
|---------|-----------------|
| Overlay | `fixed inset-0 bg-black/60 backdrop-blur-sm z-50` |
| Content | `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg z-50` |
| Close btn | `absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-zinc-800` |

**✅ Core | AnimatePresence + scale/fade animation**

---

## 4. 📋 Sheet (Slide-over Panel)

```tsx
// <Sheet side="right|left">
//   <Sheet.Content>...</Sheet.Content>
// </Sheet>
```

| Direction | Animation |
|-----------|-----------|
| `right` | `animate={{ x: ['100%', 0] }}` |
| `left` | `animate={{ x: ['-100%', 0] }}` |
| `top` | `animate={{ y: ['-100%', 0] }}` |
| `bottom` | `animate={{ y: ['100%', 0] }}` |

**✅ Core | Width: `w-[400px]` default, `w-[600px]` wide**

---

## 5. 🎯 Popover & Dropdown

```tsx
// <Popover>
//   <Popover.Trigger><Button>...</Button></Popover.Trigger>
//   <Popover.Content>...</Popover.Content>
// </Popover>
```

```tsx
// <Dropdown>
//   <Dropdown.Trigger />
//   <Dropdown.Content>
//     <Dropdown.Item icon={...} label="..." shortcut="⌘K" />
//     <Dropdown.Separator />
//     <Dropdown.Item variant="destructive" label="Delete" />
//   </Dropdown.Content>
// </Dropdown>
```

**✅ Core | `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`**

---

## 6. 🔔 Toast / Sonner Notifications

```tsx
// import { toast } from 'sonner';
// toast.success('Agent deployed');
// toast.error('Deployment failed', { description: 'Check logs', action: { label: 'View', onClick } });
```

| Type | Color | Icon |
|------|-------|------|
| Success | Green + check | ✅ |
| Error | Red + x | ❌ |
| Warning | Amber + alert | ⚠️ |
| Info | Blue + info | ℹ️ |
| Promise | Loading spinner | ⏳ |

**✅ Core | Library: `sonner@1.5` | Position: `bottom-right`**

---

## 7. ⌨️ Command Palette (Cmd+K)

```tsx
// <CommandPalette>
//   <CommandPalette.Input placeholder="Search agents, pages, commands..." />
//   <CommandPalette.Group heading="Pages">
//     <CommandPalette.Item icon={...} label="Dashboard" shortcut="⌘1" />
//   </CommandPalette.Group>
//   <CommandPalette.Group heading="Actions">
//     <CommandPalette.Item icon={...} label="Deploy Agent" />
//   </CommandPalette.Group>
// </CommandPalette>
```

| Element | Tailwind |
|---------|----------|
| Container | `max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl` |
| Input | `bg-transparent border-none h-12 text-lg text-zinc-100 placeholder:text-zinc-500` |
| Group | `px-2 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider` |
| Item | `flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 text-sm cursor-pointer` |

**✅ Core | Inspiracja: Raycast | Library: `cmdk@1.0`**

---

## 8. 📊 Data Table (TanStack Table)

```tsx
// <DataTable
//   columns={columns}
//   data={agents}
//   sorting={true}
//   filtering={true}
//   pagination={true}
//   selection="multi"
// />
```

| Feature | Implementation |
|---------|---------------|
| Sort | `@tanstack/react-table` — click header |
| Filter | Global search + per-column filter |
| Pagination | `10 / 25 / 50 / 100` rows |
| Selection | Checkbox column + header checkbox |
| Row actions | 3-dot menu per row |
| Empty state | `flex flex-col items-center justify-center py-16` |
| Loading | Skeleton rows (pulse) |

**✅ Core | `@tanstack/react-table@8`**

### Table Design

```css
.table-header { @apply px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider select-none; }
.table-cell   { @apply px-4 py-3 text-sm text-zinc-200 border-t border-zinc-800/50; }
.table-row    { @apply hover:bg-zinc-800/30 transition-colors; }
```

---

## 9. 💻 Code Editor (Monaco)

```tsx
// <CodeEditor
//   value={code}
//   onChange={setCode}
//   language="typescript"
//   theme="nexus-dark"
//   height="400px"
//   minimap={false}
// />
```

| Feature | Detail |
|---------|--------|
| Language | TS, JS, Python, SQL, JSON, YAML, Bash |
| Theme | Custom `nexus-dark` — bg: `#0a0a0b`, line highlight: `#18181b` |
| Features | Syntax highlight, bracket match, autocomplete, error markers |
| Commands | `Cmd+S` save, `Cmd+Shift+F` format, `Cmd+/` comment |

**🚀 Advanced | `@monaco-editor/react@4`**

---

## 10. 🖥️ Terminal Emulator (xterm.js)

```tsx
// <Terminal
//   rows={24}
//   theme="nexus-dark"
//   onData={(data) => sendToProcess(data)}
//   output={outputBuffer}
// />
```

| Feature | Detail |
|---------|--------|
| Colors | Nexus dark theme — cyan accent, green success, red error |
| Features | ANSI colors, scrollback, copy/paste, resizable |
| Commands | `Ctrl+C` interrupt, `Tab` autocomplete |

**🚀 Advanced | `@xterm/xterm@5`, `@xterm/addon-fit`**

---

## 11. 📈 Charts (Recharts + Tremor)

```tsx
// <LineChart data={usageData} categories={["requests", "tokens"]} />
// <BarChart data={costData} category="cost" />
// <AreaChart data={agentRuns} category="success_rate" />
// <Sparkline data={dailyActive} />
// <PieChart data={modelDistribution} />
```

| Chart Type | Use Case |
|------------|----------|
| Line (Area) | Usage over time, token consumption |
| Bar | Comparison, cost breakdown |
| Sparkline | Mini KPIs on dashboard |
| Pie/Donut | Model distribution, tool usage |
| Radar | Agent capability comparison |

**✅ Core | `recharts@2`, `@tremor/react@3`**

---

## 12. 📋 Kanban Board

```tsx
// <KanbanBoard>
//   <KanbanColumn title="To Do" count={3} color="zinc">
//     <KanbanCard title="..." priority="high" assignee="..." />
//   </KanbanColumn>
//   <KanbanColumn title="In Progress" count={2} color="cyan">
//     <KanbanCard title="..." />
//   </KanbanColumn>
//   <KanbanColumn title="Done" count={5} color="green">
//     <KanbanCard title="..." />
//   </KanbanColumn>
// </KanbanBoard>
```

**🚀 Advanced | `@dnd-kit/core@6`, `@dnd-kit/sortable`**

---

## 13. ⏱️ Timeline View

```tsx
// <Timeline>
//   <Timeline.Item
//     title="Agent initialized"
//     description="Loaded config for agent 'code-helper'"
//     timestamp="14:32:05.123"
//     icon={Play}
//     color="cyan"
//   />
//   <Timeline.Item title="Error" description="Rate limit exceeded" icon={AlertCircle} color="red" />
// </Timeline>
```

**🚀 Advanced | Virtual scrolling via `react-window` dla 10k+ eventów**

---

## 14. 🔗 Graph / Network View

```tsx
// <AgentGraph data={relationships}>
//   <GraphNode id="agent-1" label="Code Helper" type="agent" />
//   <GraphEdge source="agent-1" target="tool-1" label="uses" />
// </AgentGraph>
```

**🚀 Advanced | `react-force-graph-2d` lub `reactflow` | Inspiracja: Obsidian graph**

---

## 15. 📝 Markdown Renderer

```tsx
// <MarkdownRenderer
//   content={markdownContent}
//   codeStyle="github-dark"
//   copyButton={true}
//   tableOfContents={true}
// />
```

**✅ Core | `react-markdown@9`, `remark-gfm`, `rehype-highlight`, `rehype-raw`**

---

## 16. 🎯 Drag-n-Drop (dnd-kit)

```tsx
// <DndContext>
//   <SortableContext>
//     <SortableItem id="workflow-step-1">
//       <WorkflowNode title="Fetch Data" icon={Database} />
//     </SortableItem>
//   </SortableContext>
// </DndContext>
```

**🚀 Advanced | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`**

---

## 17. 💀 Skeleton Loaders

```tsx
// <Skeleton className="h-4 w-[250px]" />
// <Skeleton className="h-12 w-full rounded-xl" />
// <CardSkeleton lines={3} avatar={true} />
```

**✅ Core | `animate-pulse bg-zinc-800 rounded-md`**

---

## 18. 🔄 Infinite Scroll / Virtualization

```tsx
// <VirtualList
//   itemCount={10000}
//   itemHeight={48}
//   renderItem={(index, style) => <LogItem key={index} style={style} />}
// />
```

**🚀 Advanced | `react-window@1.8`, `react-virtualized-auto-sizer`**

---

## 19. 📦 Pozostałe komponenty

| # | Component | Status | Library |
|---|-----------|--------|---------|
| 19 | **Badge** (status, priority, version) | ✅ | `bg-zinc-800 text-[11px] px-1.5 py-0.5 rounded-md` |
| 20 | **Avatar** (user, agent, initials) | ✅ | `w-8 h-8 rounded-full bg-zinc-700` + fallback initials |
| 21 | **Tooltip** | ✅ | `@radix-ui/react-tooltip` |
| 22 | **Tabs** (underline, pills, icons) | ✅ | `@radix-ui/react-tabs` |
| 23 | **Accordion** | ⭐ | `@radix-ui/react-accordion` |
| 24 | **Progress Bar** (linear, circular) | ⭐ | `value% h-1.5 rounded-full bg-zinc-800` |
| 25 | **Switch / Toggle** | ✅ | `@radix-ui/react-switch` |
| 26 | **Checkbox / Radio** | ✅ | `@radix-ui/react-checkbox` |
| 27 | **Slider** | ⭐ | `@radix-ui/react-slider` |
| 28 | **Breadcrumbs** | ⭐ | `text-zinc-500 > text-zinc-300` |
| 29 | **Pagination** | ✅ | `Prev 1 2 3 ... 10 Next` |
| 30 | **Empty State** | ✅ | `flex flex-col items-center gap-4 py-16` |
| 31 | **Error Boundary** | ⭐ | `<ErrorBoundary fallback={<ErrorState />} />` |
| 32 | **Loading Spinner** | ✅ | `animate-spin text-cyan-500` |
| 33 | **Status Dot** | ✅ | `w-2 h-2 rounded-full` + colors |
| 34 | **Tag / Chip** | ✅ | `bg-zinc-800 px-2 py-0.5 rounded-md text-xs` |
| 35 | **File Upload (Drag zone)** | 🚀 | `border-2 border-dashed border-zinc-700 rounded-xl p-8` |
| 36 | **Resizable Panels** | 🚀 | `react-resizable-panels` |
| 37 | **Command / Keyboard Hint** | ⭐ | `kbd: bg-zinc-800 text-[11px] px-1.5 py-0.5 rounded` |
| 38 | **Diff Viewer** | 🚀 | `monaco-diff-editor` lub `react-diff-viewer-continued` |
| 39 | **JSON Tree Viewer** | ⭐ | `react-json-view-lite` |
| 40 | **Notification Bell** | ⭐ | `relative w-8 h-8 + dot badge` |
| 41 | **Search Bar (Command)** | ✅ | `w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5` |
| 42 | **Activity Feed** | ⭐ | `flex flex-col gap-1 — avatar + text + timestamp` |
| 43 | **Split Pane** | 🚀 | `w-full h-full flex — left (40%) right (60%)` |
| 44 | **Diff Code Block** | 🚀 | `+green/-red line highlighting` |

---

## 📦 Pełna lista zależności

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "sonner": "^1.5.0",
    "cmdk": "^1.0.0",
    "lucide-react": "^0.450.0",
    "framer-motion": "^11.0.0",
    "@tanstack/react-table": "^8.20.0",
    "@monaco-editor/react": "^4.6.0",
    "@xterm/xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0",
    "recharts": "^2.13.0",
    "@tremor/react": "^3.18.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "react-window": "^1.8.0",
    "react-resizable-panels": "^2.1.0",
    "reactflow": "^11.11.0",
    "react-force-graph-2d": "^1.25.0",
    "react-diff-viewer-continued": "^4.0.0",
    "react-json-view-lite": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  }
}
```

---

*Components Library v1.0 — 44 komponenty | 3 poziomy priorytetu | 30+ zależności*
