import { useEffect, useCallback } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

/**
 * useHotkeys — register keyboard shortcuts.
 * @param key Klawisz docelowy (np 'k', 'n', '/')
 * @param handler Callback z eventem
 * @param deps useEffect dependencies (domyślnie [])
 * @param meta Wymaga Cmd (Mac) / Ctrl (Windows)
 */
export function useHotkeys(
  key: string,
  handler: KeyHandler,
  deps: any[] = [],
  meta: boolean = true
) {
  const stableHandler = useCallback(handler, deps);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMeta = meta ? (e.metaKey || e.ctrlKey) : true;
      if (!isMeta) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;

      // Don't trigger in inputs unless it's '/' (search)
      if (key !== "/" && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;

      stableHandler(e);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, meta, stableHandler]);
}
