import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

// ─── Public API: ToastProvider + useToast() ─────────────────────────
//
// Strategy A: a small, owned state machine for visible toasts rather
// than a thin re-export of `sonner`. The test contract specifies
// plain-text icons (✓ ✕ ℹ ⚠), `role="log"` + `aria-live="polite"`
// container, aria-label="Dismiss notification" close button, 3-second
// auto-dismiss + 400 ms exit phase. Reproducing those invariants on
// top of `sonner` would require custom icon components and overriding
// the viewport container — overall the same line-count, more fragile
// cross-version coupling. Owning the lifecycle keeps it test-stable
// and dependency-light.
//
// • `showToast(message, level)` enters a toast with the relevant icon
// • Auto-dismiss after 3000 ms; close button dismisses earlier
// • Exit phase lasts 400 ms before the element unmounts
// • Renders a fixed top-right region with backdrop-blur styling
// • Re-entrant: each toast has a unique id so duplicate calls stack
//
// Backward-compat: `Toaster` + `toast` re-exports from `sonner`
// remain available for any caller that still uses the direct API,
// e.g. routes that haven't migrated yet. App.tsx is the only known
// caller and was migrated in commit "fix(routes): wrap App in
// ToastProvider + migrate toast.* calls".

export type ToastLevel = "success" | "error" | "info" | "warning";

interface InternalToast {
  id: string;
  message: string;
  level: ToastLevel;
  phase: "enter" | "exit";
}

interface ToastContextValue {
  showToast: (message: string, level: ToastLevel) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Defensive fallback: legacy callers outside a <ToastProvider> get
  // a no-op rather than crashing. Production wiring always wraps
  // with the provider at the app root.
  if (!ctx) return { showToast: () => {} };
  return ctx;
}

const LEVEL_ICON: Record<ToastLevel, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const AUTO_DISMISS_MS = 3000;
const EXIT_ANIMATION_MS = 400;

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<InternalToast[]>([]);
  // Map keyed by `${kind}:${id}` — `auto:${id}` for dismiss timer,
  // `exit:${id}` for exit-animation timer. Allows safe cleanup on
  // manual dismiss (clears auto before scheduling exit).
  const timersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );

  const dismiss = useCallback((id: string) => {
    setItems((cur) =>
      cur.map((t) => (t.id === id ? { ...t, phase: "exit" as const } : t))
    );
    const exitTimer = setTimeout(() => {
      setItems((cur) => cur.filter((t) => t.id !== id));
      timersRef.current.delete(`exit:${id}`);
    }, EXIT_ANIMATION_MS);
    timersRef.current.set(`exit:${id}`, exitTimer);

    // Cancel the pending auto-dismiss so a manual click doesn't race
    // with the 3000 ms timer.
    const autoTimer = timersRef.current.get(`auto:${id}`);
    if (autoTimer !== undefined) {
      clearTimeout(autoTimer);
      timersRef.current.delete(`auto:${id}`);
    }
  }, []);

  const showToast = useCallback(
    (message: string, level: ToastLevel) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setItems((cur) => [
        ...cur,
        { id, message, level, phase: "enter" as const },
      ]);
      const autoTimer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.set(`auto:${id}`, autoTimer);
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((h) => clearTimeout(h));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="log"
        aria-live="polite"
        className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto"
        data-testid="toast-region"
      >
        {items.map((t) => (
          <div
            key={t.id}
            data-phase={t.phase}
            data-level={t.level}
            className="min-w-[240px] max-w-sm px-3 py-2 rounded-md text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex items-center gap-2 bg-[rgba(17,17,20,0.92)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] text-[#E4E4E7]"
            style={{
              opacity: t.phase === "exit" ? 0 : 1,
              transition: `opacity ${EXIT_ANIMATION_MS}ms ease-out`,
            }}
          >
            <span aria-hidden="true" className="font-mono shrink-0">
              {LEVEL_ICON[t.level]}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-[#71717A] hover:text-[#E4E4E7] text-sm leading-none px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Legacy re-exports (sonner direct API) ──────────────────────────
//
// Kept for any old caller that still uses `toast.success / .info / .error`
// or imports `<Toaster>` directly. App.tsx is migrated to useToast()
// in a sibling commit; if you find new code that relies on these,
// prefer migrating to useToast() and we can drop both exports.
export const Toaster = SonnerToaster;
export const toast = sonnerToast;
