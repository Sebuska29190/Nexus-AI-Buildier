import { useState, useEffect, useCallback, useRef } from "react";
import { useHotkeys } from "../hooks/useHotkeys";

interface PaletteAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

const PAGES: PaletteAction[] = [
  { id: "dashboard", label: "Dashboard", description: "Główna strona", icon: "◇", action: () => {} },
  { id: "chat", label: "Chat", description: "Nowa rozmowa", icon: "💬", shortcut: "⌘N", action: () => {} },
  { id: "agents", label: "Agenci", description: "Lista wszystkich agentów", icon: "🤖", action: () => {} },
  { id: "sessions", label: "Sesje", description: "Historia sesji", icon: "📋", action: () => {} },
  { id: "terminal", label: "Terminal", description: "Wbudowany terminal", icon: "⌨️", action: () => {} },
  { id: "skills", label: "Narzędzia", description: "Lista skilli i pluginów", icon: "🔧", action: () => {} },
  { id: "settings", label: "Ustawienia", description: "Konfiguracja aplikacji", icon: "⚙️", action: () => {} },
  { id: "apikeys", label: "Klucze API", description: "Zarządzanie kluczami", icon: "🔑", action: () => {} },
  { id: "memory", label: "Pamięć", description: "Agent memory viewer", icon: "🧠", action: () => {} },
  { id: "models", label: "Modele", description: "Dostępne modele LLM", icon: "📡", action: () => {} },
  { id: "docs", label: "Dokumentacja", description: "Dokumentacja API", icon: "📄", action: () => {} },
];

const QUICK_ACTIONS: PaletteAction[] = [
  { id: "new-chat", label: "Nowy czat", description: "Rozpocznij nową rozmowę", icon: "💬", shortcut: "⌘N", action: () => {} },
  { id: "search-sessions", label: "Szukaj sesji", description: "Znajdź sesję po ID", icon: "🔍", action: () => {} },
];

interface CommandPaletteProps {
  onNavigate: (route: string) => void;
  onNewChat?: () => void;
}

export function CommandPalette({ onNavigate, onNewChat }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = [...PAGES, ...QUICK_ACTIONS].map(item => ({
    ...item,
    action: item.id === "new-chat" ? (onNewChat || item.action) : () => onNavigate(item.id),
  }));

  const filtered = query.trim() === ""
    ? allItems
    : allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );

  useHotkeys("k", (e) => {
    e.preventDefault();
    setOpen(prev => !prev);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const handleSelect = useCallback((item: PaletteAction) => {
    item.action();
    handleClose();
  }, [handleClose]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[60]"
        onClick={handleClose}
        onKeyDown={() => {}}
        role="presentation"
      />

      {/* Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[70] animate-fade-in">
        <div className="bg-[#111113] border border-[rgba(255,255,255,0.10)] rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(245,158,11,0.10)] overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <svg className="w-4 h-4 text-[#71717A] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj strony, akcji..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#E4E4E7] placeholder-[#71717A] font-mono"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
                if (e.key === "Enter" && filtered[selectedIndex]) handleSelect(filtered[selectedIndex]);
                if (e.key === "Escape") handleClose();
              }}
            />
            <kbd className="text-[10px] font-mono text-[#71717A] bg-[#161618] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#71717A] font-mono">
                Brak wyników dla <span className="text-[#A1A1AA]">"{query}"</span>
              </div>
            ) : (
              filtered.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100 ${
                    idx === selectedIndex
                      ? "bg-[rgba(245,158,11,0.08)] text-[#F59E0B]"
                      : "text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.03)]"
                  }`}
                >
                  <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${idx === selectedIndex ? "text-[#E4E4E7]" : "text-[#E4E4E7]"}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-[#71717A] truncate font-mono">{item.description}</div>
                  </div>
                  {item.shortcut && (
                    <kbd className="text-[9px] font-mono text-[#71717A] bg-[#161618] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)] shrink-0">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0b]">
            <div className="flex items-center gap-1.5">
              <kbd className="text-[9px] font-mono text-[#71717A] bg-[#161618] px-1 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">↑↓</kbd>
              <span className="text-[9px] text-[#71717A] font-mono">nawigacja</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="text-[9px] font-mono text-[#71717A] bg-[#161618] px-1 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">⏎</kbd>
              <span className="text-[9px] text-[#71717A] font-mono">wybierz</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="text-[9px] font-mono text-[#71717A] bg-[#161618] px-1 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">⌘K</kbd>
              <span className="text-[9px] text-[#71717A] font-mono">zamknij</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
