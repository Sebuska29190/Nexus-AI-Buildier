import { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: TouchEvent) => {
      const target = sheetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      if ((e.touches[0]?.clientY || 0) > rect.top + 50) return;
      onClose();
    };
    document.addEventListener("touchstart", handler);
    return () => document.removeEventListener("touchstart", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 md:hidden" onClick={onClose} />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121a] border-t border-[rgba(255,255,255,0.08)] rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up md:hidden"
      >
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)]" />
        </div>
        {title && (
          <div className="px-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
