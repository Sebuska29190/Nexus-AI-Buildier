# Changelog

## [1.0.0] — 2026-07-20

### 🎨 Branding
- **Pełny rebrand: Nexus AI → AgentForge**
- Nowa nazwa: `AgentForge` z tagline "Forge autonomous coding agents. Locally."
- Nowe logo: SVG anvil + spark (kolor amber #F59E0B)
- Paleta kolorów: amber/orange zamiast fiolet/cyan
- Package name: `agentforge` (było `nova-ai-builder`)

### 🎨 Design System
- **Nowa paleta AgentForge v3:**
  - Primary accent: `#F59E0B` (amber)
  - Secondary: `#EA580C` (orange), `#FCD34D` (yellow)
  - Background: `#0a0a0b`, `#111113`, `#161618` (flat dark)
  - Text: `#E4E4E7`, `#A1A1AA`, `#71717A` (zinc scale)
  - Border: `rgba(255,255,255,0.06)` subtle, `0.10` default
- Ostrejsze rogi: `rounded-md`/`rounded-lg` zamiast `rounded-2xl`
- Flat surfaces: usunięto `backdrop-blur-xl` (glassmorphism)
- Monospace labels: `font-mono` w headerach/badge'ach (estetyka builder)

### 🎨 UI Redesign
- **39 plików przerobionych** na nową paletę amber:
  - Sidebar: gradient logo (#F59E0B→#EA580C), active nav z amber left-border
  - Dashboard: stat cards z amber tint, section headers font-mono
  - Chat: user bubble amber gradient, thinking blocks amber
  - Wszystkie komponenty Glass*: flat opaque zamiast transparent
  - Wszystkie strony routes: AgentsPage, SessionsPage, TerminalPage, SettingsPage, itd.
- Logo SVG anvil+spark w sidebar (expanded + collapsed)

### ✨ UX Features
- **Command Palette (Cmd+K):** szybka nawigacja między stronami
  - 11 stron + quick actions (new chat, search sessions)
  - Keyboard navigation (↑↓ arrows, Enter, Esc)
  - Filtruje po nazwie/opisie w real-time
  - Styl: amber highlight, zinc text, flat dark
- **Keyboard shortcuts:** `j`/`k` nawigacja, `/` search, `c` new chat
- **Coding-first filter:** toggle "Coding Agents Only" na AgentsPage
  - Filtruje agentów po nazwie (Code, Dev, Builder, Engineer, Architect)
  - Amber style when active (#F59E0B), zinc when inactive (#71717A)

### 🔧 Infrastructure
- `.gitattributes` dodany (text=auto eol=lf)
- Usunięto pliki tymczasowe (check-db.js, x-post-draft.txt, test_server.ts)
- Build: 0 błędów, 4.48s, rozsądny rozmiar bundle

### 📊 Verification
- **0 starych kolorów** (#7C3AED, #6366f1, #8b5cf6, #a78bfa, #00d4ff)
- **0 "Nexus" w display** (poza env vars NEXUS_API_KEY/NEXUS_ENCRYPTION_SECRET)
- Build przechodzi bez błędów
- Wszystkie 39 stron/komponentów przerobionych

---

## [4.0.0] — 2026-07-19 (Nexus AI)

### Security & Stability
- 4-fazowa naprawa audytowa (Security, Stability, Code Quality, DevOps)
- 0 HIGH vulnerabilities
- 86.78% test coverage
- Auth middleware opt-in dla lokalnego trybu

### Settings & API Keys
- SettingsPage: taby General/Models & Providers/Security
- ApiKeysPage: 6 providerów (DeepSeek, OpenAI, Anthropic, Gemini, Ollama, Grok)
- Endpointy: GET/POST `/api/settings`, POST `/api/settings/reset`

### Bug Fixes
- Naprawa mojibake emoji (112 agentów) — double-encoded UTF-8
- Sidebar: dodano "Ustawienia" + "Klucze API" (było tylko "Konfiguracja")

---

Format: [Keep a Changelog](https://keepachangelog.com/)
