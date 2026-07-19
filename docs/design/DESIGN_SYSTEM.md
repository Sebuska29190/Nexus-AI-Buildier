# 🎨 Nexus AI v4.0 — Design System

> Inspiracje: Linear, Vercel, Arc Browser, Framer | Poziom: **2026 cutting-edge**

---

## 1. 🎯 Filozofia Designu

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Nexus AI Design Philosophy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Purposeful minimalism — każde pixel ma znaczenie
  • Data density — dużo informacji, zero chaosu
  • Glassmorphism 2.0 — głębia przez przezroczystość
  • Motion as feedback — nie dla efektu, dla kontekstu
  • Keyboard-first — każda akcja dostępna z klawiatury
  • Consistent rhythm — 4px grid we wszystkim
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 2. 🎨 Paleta Kolorów

### Dark Theme (Primary)

```css
/* Tailwind v4 custom colors — dark theme */
:root {
  --color-bg-primary:     #0a0a0b;    /* zinc-950 — tło główne */
  --color-bg-secondary:   #121214;    /* tło kart / sidebar */
  --color-bg-tertiary:    #18181b;    /* tło hover / panele */
  --color-bg-elevated:    #1c1c1e;    /* modale, dropdowny */
  --color-bg-glass:       rgba(24, 24, 27, 0.7);  /* glassmorphism */
  --color-bg-glass-heavy: rgba(24, 24, 27, 0.85);

  /* Surface borders */
  --color-border-primary:  #27272a;   /* zinc-800 — standard border */
  --color-border-subtle:   #1f1f23;   /* zinc-800/50 — subtelny */
  --color-border-hover:    #3f3f46;   /* zinc-700 — hover state */

  /* Text */
  --color-text-primary:    #fafafa;   /* zinc-50 — primary text */
  --color-text-secondary:  #a1a1aa;   /* zinc-400 — secondary text */
  --color-text-tertiary:   #71717a;   /* zinc-500 — placeholder, disabled */
  --color-text-inverse:    #09090b;   /* na jasnych akcentach */
}
```

### Accent Colors (Neon 2026)

```css
:root {
  /* Główny accent — Neon Cyan */
  --color-accent:          #06b6d4;   /* cyan-500 */
  --color-accent-soft:     #0891b2;   /* cyan-600 — hover */
  --color-accent-muted:    rgba(6, 182, 212, 0.15);  /* bg */
  --color-accent-glow:     rgba(6, 182, 212, 0.3);   /* glow effect */

  /* Secondary accent — Violet */
  --color-accent-secondary: #8b5cf6;  /* violet-500 */
  --color-accent-violet-muted: rgba(139, 92, 246, 0.15);

  /* Semantic colors */
  --color-success:         #22c55e;   /* green-500 */
  --color-success-soft:    rgba(34, 197, 94, 0.12);
  --color-warning:         #f59e0b;   /* amber-500 */
  --color-warning-soft:    rgba(245, 158, 11, 0.12);
  --color-error:           #ef4444;   /* red-500 */
  --color-error-soft:      rgba(239, 68, 68, 0.12);
  --color-info:            #3b82f6;   /* blue-500 */
  --color-info-soft:       rgba(59, 130, 246, 0.12);
}
```

### Gradienty Signature

```css
/* Nexus Signature Gradients */
.nexus-gradient-primary {
  background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
}
.nexus-gradient-subtle {
  background: linear-gradient(180deg, rgba(6,182,212,0.08) 0%, transparent 100%);
}
.nexus-gradient-card {
  background: linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(139,92,246,0.05) 100%);
}
.nexus-glow {
  box-shadow: 0 0 20px rgba(6,182,212,0.15), 0 0 60px rgba(6,182,212,0.05);
}
```

---

## 3. 🔤 Typografia

### Font Stack

```css
/* tailwind.config / theme */
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
},
```

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Display (h1) | Inter | 700 | 2rem / 32px | 1.2 |
| Heading (h2) | Inter | 600 | 1.5rem / 24px | 1.3 |
| Heading (h3) | Inter | 600 | 1.125rem / 18px | 1.4 |
| Body | Inter | 400 | 0.875rem / 14px | 1.5 |
| Body Small | Inter | 400 | 0.8125rem / 13px | 1.5 |
| Caption | Inter | 400 | 0.75rem / 12px | 1.4 |
| Code | JetBrains Mono | 400 | 0.8125rem / 13px | 1.5 |
| Code Small | JetBrains Mono | 400 | 0.75rem / 12px | 1.4 |
| Numeric (tables) | JetBrains Mono | 500 | 0.8125rem / 13px | 1.4 |
| Label | Inter | 500 | 0.75rem / 12px | 1.4 |

### Tailwind classes — text scale

```css
.text-display — text-2xl font-bold leading-tight
.text-heading — text-xl font-semibold tracking-tight
.text-subhead — text-lg font-semibold
.text-body    — text-sm
.text-small   — text-xs
.text-code    — text-xs font-mono tracking-tight
```

### Letter Spacing

```css
.heading { letter-spacing: -0.025em; }   /* tracking-tight */
.body    { letter-spacing: -0.01em; }   /* subtelne kern */
.code    { letter-spacing: -0.02em; }
```

---

## 4. 📐 Spacing System (4px Grid)

```
4px  →  p-0.5  (0.25rem)
8px  →  p-2    (0.5rem)
12px →  p-3    (0.75rem)
16px →  p-4    (1rem)
20px →  p-5    (1.25rem)
24px →  p-6    (1.5rem)
32px →  p-8    (2rem)
40px →  p-10   (2.5rem)
48px →  p-12   (3rem)
64px →  p-16   (4rem)
```

### Design Tokens — Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0_5` | 4px | Inner padding micro |
| `--space-1` | 8px | Stack tight, icon spacing |
| `--space-1_5` | 12px | Padding inputs, buttons |
| `--space-2` | 16px | Card padding, gap sections |
| `--space-3` | 24px | Section spacing, modal padding |
| `--space-4` | 32px | Page margins, large gaps |
| `--space-6` | 48px | Section blocks |
| `--space-8` | 64px | Page sections |

---

## 5. 🔲 Radius, Shadows, Borders

### Border Radius

```css
:root {
  --radius-none:     0px;
  --radius-sm:       4px;    /* inputs, small UI */
  --radius-md:       6px;    /* buttons, cards */
  --radius-lg:       8px;    /* modals, sheets */
  --radius-xl:       12px;   /* dialogs, panels */
  --radius-2xl:      16px;   /* cards featured */
  --radius-full:     9999px; /* pills, badges, avatars */
}

/* Tailwind — rounded-[4,6,8,12,16] */
```

### Shadows

```css
:root {
  --shadow-xs:   0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md:   0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
  --shadow-lg:   0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2);
  --shadow-xl:   0 20px 25px rgba(0,0,0,0.4), 0 10px 10px rgba(0,0,0,0.2);
  --shadow-glow: 0 0 20px rgba(6,182,212,0.15), 0 0 40px rgba(6,182,212,0.05);
}
```

### Borders

```css
.border-default { @apply border border-zinc-800; }
.border-subtle  { @apply border border-zinc-800/50; }
.border-hover   { @apply border border-zinc-700 hover:border-zinc-600; }
.border-accent  { @apply border border-cyan-500/30; }
.border-active  { @apply border-2 border-cyan-500; }
```

---

## 6. 🎬 Motion (Framer Motion)

### Motion Philosophy

> "Motion nie istnieje dla ozdoby — istnieje dla kontekstu, hierarchii i feedbacku."

### Timing Tokens

```typescript
// framer-motion@11 — design tokens
export const motionTokens = {
  duration: {
    instant: 0.1,    // hover, tap
    fast:    0.15,   // micro-interactions
    normal:  0.2,    // panels, sheets
    slow:    0.3,    // modals, page transitions
    gentle:  0.5,    // background reveals
  },
  easing: {
    // Linear-style snappy
    spring:  { type: "spring", stiffness: 400, damping: 30 },
    smooth:  [0.32, 0.72, 0, 1],  // custom bezier
    fade:    [0.4, 0, 0.2, 1],    // fade transitions
    bounce:  { type: "spring", stiffness: 300, damping: 15 },
  }
}
```

### Animation Patterns

| Pattern | Use Case | Implementation |
|---------|----------|---------------|
| **Fade in** | Panels, sheets loading | `animate={{ opacity: [0,1], y: [8,0] }}` |
| **Scale in** | Modal, dialog | `animate={{ scale: [0.95, 1], opacity: [0,1] }}` |
| **Slide** | Sheet, sidebar | `animate={{ x: ['100%', 0] }}` |
| **Stagger** | Lists, grid items | `staggerChildren: 0.04` |
| **Layout** | Reorder, DnD | `layoutId` + `layout` prop |
| **Exit** | Unmount anim | `exit={{ opacity: 0, scale: 0.95 }}` |
| **Page** | Route transition | `AnimatePresence` + `mode="wait"` |

### Glassmorphism + Motion

```tsx
{/* Glass panel z mikro-interakcją */}
<motion.div
  className="backdrop-blur-xl bg-zinc-900/70 border border-zinc-800/50 rounded-xl"
  whileHover={{ scale: 1.01, borderColor: 'rgba(6,182,212,0.2)' }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
/>
```

---

## 7. 🎯 Glassmorphism 2.0 — Specyfikacja

```css
/* Glass Card — podstawowy */
.glass-card {
  background: rgba(24, 24, 27, 0.6);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(39, 39, 42, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

/* Glass Card — elevated (modal) */
.glass-elevated {
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(32px) saturate(1.4);
  border: 1px solid rgba(63, 63, 70, 0.3);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), 0 0 80px rgba(6, 182, 212, 0.03);
}

/* Glass Sidebar */
.glass-sidebar {
  background: rgba(18, 18, 20, 0.75);
  backdrop-filter: blur(24px) saturate(1.1);
  border-right: 1px solid rgba(39, 39, 42, 0.4);
}
```

---

## 8. 🪄 Interactive States

```css
/* Hover — wszystkie interaktywne elementy */
.hover-lift {
  transition: all 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}
.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Focus ring — keyboard navigation */
.focus-ring {
  @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950;
}

/* Active press */
.active-press:active {
  transform: scale(0.98);
}
```

---

## 9. 📱 Responsive Breakpoints

```typescript
// tailwind.config
screens: {
  xs:  '475px',
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
}
```

| Breakpoint | Device | Layout Behavior |
|-----------|--------|----------------|
| < 475px | Mobile | Single column, bottom nav |
| 475-768px | Tablet | Narrow sidebar, stacked |
| 768-1024px | Small desktop | Condensed layout |
| 1024-1280px | Desktop | Full experience |
| 1280px+ | Wide | Max-width container, multi-pane |

---

## 10. 🧩 CSS Custom Properties — Podsumowanie

```css
/* === DESIGN TOKENS — kompletny zestaw === */
:root {
  /* Backgrounds */
  --bg-primary:     #0a0a0b;
  --bg-secondary:   #121214;
  --bg-tertiary:    #18181b;
  --bg-elevated:    #1c1c1e;
  --bg-glass:       rgba(24, 24, 27, 0.7);

  /* Borders */
  --border-default: #27272a;
  --border-subtle:  #1f1f23;
  --border-hover:   #3f3f46;

  /* Text */
  --text-primary:   #fafafa;
  --text-secondary: #a1a1aa;
  --text-tertiary:  #71717a;

  /* Accent */
  --accent:         #06b6d4;
  --accent-soft:    #0891b2;
  --accent-muted:   rgba(6, 182, 212, 0.15);
  --accent-violet:  #8b5cf6;

  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error:   #ef4444;
  --info:    #3b82f6;

  /* Radius */
  --radius-sm:  4px;
  --radius-md:  6px;
  --radius-lg:  8px;
  --radius-xl:  12px;
  --radius-2xl: 16px;

  /* Font */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## 11. 📦 Zależności — Design System

```json
{
  "dependencies": {
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.450.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-slot": "^1.1.0"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.0",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

---

*Design System v1.0 — Nexus AI v4.0 | Ostatnia aktualizacja: 2026-07-19*
