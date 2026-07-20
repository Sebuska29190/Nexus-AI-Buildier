import { useState, useEffect, createContext, useContext, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message: msg, type, visible: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: true } : t));
    }, 10);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: false } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2" role="log" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => {
          const typeStyles: Record<string, string> = {
            success: "bg-[rgba(34,197,94,0.12)] text-[#22c55e] border border-[rgba(34,197,94,0.2)]",
            error: "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.2)]",
            info: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]",
            warning: "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]",
          };
          const icons: Record<string, string> = {
            success: "✓",
            error: "✕",
            info: "ℹ",
            warning: "⚠",
          };

          return (
            <div
              key={toast.id}
              role="alert"
              aria-live="assertive"
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm max-w-[400px] transition-all duration-300 ease-out shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
                toast.visible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
              } ${typeStyles[toast.type] || typeStyles.info}`}
            >
              <span className="text-xs shrink-0 font-bold" aria-hidden="true">{icons[toast.type]}</span>
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => {
                  setToasts((prev) => prev.map((t) => t.id === toast.id ? { ...t, visible: false } : t));
                  setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 300);
                }}
                className="bg-none border-none text-inherit opacity-50 cursor-pointer text-xs p-0.5 shrink-0 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
