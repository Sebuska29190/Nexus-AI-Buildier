import { useEffect, useCallback } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

/**
 * useHotkeys — register a global keyboard shortcut.
 *
 * By default a modifier (Cmd on macOS, Ctrl elsewhere) is required
 * and the handler will NOT fire while focus is inside an
 * `<input>` / `<textarea>` — this avoids hijacking typing. The
 * exception is the '/' key, which is conventionally bound to
 * "focus the search field" and is intentionally allowed inside
 * inputs so the user can re-trigger search without first blurring
 * the field.
 *
 * @param key        Key to listen for (case-insensitive). Examples: "k", "/", "n".
 * @param handler    Callback receiving the original KeyboardEvent.
 * @param deps       useEffect dependencies for memoising `handler` (default: []).
 * @param meta       Require Cmd/Ctrl (default: true). Pass false for plain keys.
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

      // '/' is the conventional "focus search" shortcut — always let
      // it through, even from inside an input, so search stays
      // re-triggerable without first blurring the field.
      // All other shortcuts defer to the typist in inputs/textareas.
      if (key !== "/" && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;

      stableHandler(e);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, meta, stableHandler]);
}
