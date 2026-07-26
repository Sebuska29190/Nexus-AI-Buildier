# Plan Modernizacji: AgentForge

## 1. Architektura i Stos Technologiczny

**Co zostawić:**
- **Bun + Hono:** Doskonały wybór pod kątem wydajności i szybkości; wbudowany SQLite świetnie pasuje do architektury self-hosted.
- **React 19 + Vite:** Najnowocześniejszy stack na frontendzie.
- **SQLite:** Prosta dystrybucja bez konfiguracji (zero-config).

**Co zmienić / zaktualizować:**
- **Zarządzanie Monorepo:** Zastąpić proste skrypty `build:ui` narzędziem takim jak **Turborepo** lub zintegrowanymi workspaces z Buna (`bun run --filter`). Ułatwi to budowanie, równoległe testy i cachowanie.
- **Type Safety API (RPC):** Zamiast ręcznie utrzymywać typy w `packages/sdk`, zastosować **Hono RPC** (`hono/client`). Frontend automatycznie dziedziczy typy bezpośrednio z endpointów backendu.
- **ORM:** Wprowadzić **Drizzle ORM**. Zastąpi on zapytania natywne, wniesie pełne bezpieczeństwo typów (Type-Safety) w komunikacji z bazą i obsłuży migracje struktury dla 129 agentów.

## 2. System Designu i Redesign UX

- **Rozwiązanie problemu PL/EN:** Wprowadzić framework i18n (np. `i18next` lub zunifikowane pliki słownikowe JSON). **Zalecenie:** Językiem głównym i w kodzie powinnien być angielski (wymuszone nazewnictwo), a polski jedynie jako powłoka (translation layer).
- **Amber Design System:** Uporządkować zmienne i komponenty bazując na instalacjach Radix UI. Najleppej zastosować pełnego **shadcn/ui** i skonfigurować go dla zmiennych wariantu bursztynowego (Amber).
- **Dostępność i Theming:** Zaimplementować system obsługujący czysty Tryb Ciemny (Dark Mode). AgentForge jako narzędzie dla developerów będzie w 90% używane w trybie nocnym.
- **Wizualizacja (React Flow):** Wykorzystać obecny w `package.json` `@xyflow/react` do czytelnego mapowania "Myśli", przepływu zadań Multi-agentów i "Evidence Protocol".

## 3. Nowe Funkcje (AI / DX)

- **Model Context Protocol (MCP):** Ponieważ jest już agent "mcp-developer", dodanie natywnej integracji z protokołem MCP od Anthropic jako warstwy wtyczek usunie potrzebę pisania niestandardowych narzędzi w przyszłości.
- **Docker / DevContainers dla Agentów:** Wykonanie kodu na maszynie hosta jest ryzykowne dla self-hosted. Stworzyć nową wtyczkę egzekucyjną wykorzystującą izolowane środowiska (np. uruchamianie piaskownic przy pomocy Dockera).
- **Smart Local Fallback:** Automatyczne przełączanie na Ollama/LM Studio z sieci lokalnej w przypadku wystąpienia Circuit Breakera w providerach premium (OpenAI / DeepSeek).

## 4. Rzeczy do usunięcia / wygaszenia (Deprecation)

- **Ghost Packages:** Usunąć nazewnictwo `nexus-ai-ui`, `nexus-ai-core`. Obecnie widnieją w `package.json` — ujednolicić tagi monorepo pod `@agentforge/core`, `@agentforge/ui` itp.
- **Customowe SDK:** Pakiety definiujące manualnie struktury request/response można wygaszać na rzecz Hono RPC.
- **Dostawcy niszowi:** Jeżeli któryś z 8-12 dostawców jest przestarzały, zdeprecjonować ich kod i oprzeć się w pełni uniwersalnym pluginie "Custom / OpenAI-compatible".

## 5. Poprawa Jakości i DX (Code Quality)

- **Type-checking jako świętość:** Wyeliminować 37 błędów TypeScript (priorytet najwyższy). Dodać krok na CI (`tsc --noEmit`), który zwróci błąd, jeśli wystąpi jakikolwiek brak typu.
- **Biome.js:** Brak ESLint/Prettier to duży minus rozwojowy. Instalacja **Biome.js** idealnie pasuje do stosu Bun/Vite — jest superszybki, jednoplikowy (`biome.json`) i załatwia naraz linter i formater bez chaosu konfiguracyjnego.
- **Testowanie długu:** Testy infrastruktury (ApiKeysPage itp.), które zawodzą (10 błędów w Vitest), muszą natychmiast otrzymać odpowiednie uaktualnienia zamockowanych środowisk (Mock Service Worker / usunięcie wyścigu pamięci), aby zielone testy znów dyktowały tempo developmentu.

## 6. Bezpieczeństwo i Operacyjność

- **Walidacja na Brzegach:** Użycie **Zod** (`@hono/zod-validator`) na absolutnie każdym endpoincie przed wejściem logiki.
- **Hardening AgentFS:** Oprócz ścieżkowego blokowania katalogów root (które da się ominąć przez np. specyficzne ataki symboliczne), izolacja procesów wykonywanych przez agenta i limit zasobów (CPU/RAM).
- **Szyfrowanie Zmienne:** Uszczelnienie AES dla tokenów - upewnić się, że wektor inicjalizacyjny (IV) i sól są poprawnie per-użytkownik/zmienną przydzielone (aby zniwelować ataki tęczowych tablic).

## 7. Plan Etapowy i Ścieżka (Roadmap)

### Faza 1: Oczyszczenie i Stabilizacja (Tygodnie 1-2)
- Rozwiązanie 37 błędów TypeScript.
- Rozwiązanie 10 błędów psujących środowisko Vitest.
- Ujednolicenie nazw procesów/katalogów (usunięcie pozostałości po Nexus AI).
- Konfiguracja `Biome.js` na powłoce monorepo (linter + pre-commit hook w Husky).
- Zapięcie minimalnego CI/CD w GitHub Actions (`bun install`, `biome check`, `tsc`, `vitest`).

### Faza 2: Poprawa Architektury (Miesięce 1-2)
- Podniesienie jakości architektury plików — wprowadzenie Turborepo dla szybkości.
- Wymiana ręcznego SDK na Hono RPC.
- Zastąpienie surowych zapytań systemem Drizzle ORM.
- Rozwiązanie internacjonalizacji PL/EN – przygotowanie `i18next` z czystym językiem angielskim pod maską.

### Faza 3: Zaawansowane Możliwości (Miesiące 3+)
- Zaimplementowanie wsparcia dla Model Context Protocol (MCP).
- Przeniesienie `agentfs` i środowisk testowych do Dockerowych piaskownic.
- Wizualizacja pamięci "Evidence Protocol" na dedykowanych drzewach myśli.

## 8. Ryzyka i Mitygacja

1. **Rozmycie zakresu (Scope Creep) przy łataniu długu:** Łatwo wpaść z rąk do rąk próbując poprawić TS, Vite, stan, RPC za jednym zamachem.
   - *Mitygacja:* Ściśle zachowane kroki — żadnych nowych feature'ów dopóki CI nie świeci na zielono.
2. **Koszty LLM w fazie nauki pętli (Learning Loop):** Agenty wpadające w pętlę generują astronomiczne requesty.
   - *Mitygacja:* Ustawienie twardego "Hard Stop / API Limit" niezależnie pod circuit breakera Hono, bezpośrednio w module `runner.ts`, używając limitów dziennych i tokenowych lokalnego JWT per sesja.
3. **Ryzyko Bezpieczeństwa (RCE):** Ponieważ jest to maszyna "self-hosted" używająca narzędzi z uprawnieniami CLI.
   - *Mitygacja:* Wykładnicza implementacja Sandboxu – do momentu wprowadzenia Dockera, wprowadzony podwójny manualny monit zgody (Confirmation Prompt) na szczególnie groźne operacje dyskowe.
