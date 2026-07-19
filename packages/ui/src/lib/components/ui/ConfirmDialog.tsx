import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        confirmRef.current?.focus();
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-300 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="panel-strong rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] w-[400px] max-h-[80vh] flex flex-col overflow-hidden animate-dialog-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-nova-border">
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-[#8892a8]">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-nova-border">
          <button
            onClick={onCancel}
            className="btn-glass px-4 py-2 rounded-lg text-xs font-medium"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              variant === "danger"
                ? "bg-[rgba(239,68,68,0.15)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.25)]"
                : "bg-[rgba(99,102,241,0.15)] text-[#818cf8] hover:bg-[rgba(99,102,241,0.25)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
