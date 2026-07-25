/**
 * CodeBlock — Syntax-highlighted code block with highlight.js
 * Dark bg, line numbers, glass header bar with copy/apply actions.
 */
import { useState, useEffect, useRef } from "react";
import { Copy, Check, FileCode, Play } from "lucide-react";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import { cn } from "../../utils";

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  onApply?: (code: string) => void;
}

export function CodeBlock({ code, language = "", filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const lines = code.split("\n");
  const lang = language || "text";

  useEffect(() => {
    if (codeRef.current && language && hljs.getLanguage(language)) {
      // highlight.js escapes HTML by default, but run the result through
      // DOMPurify as defense in depth so an attacker-controlled `code`
      // prop can never inject executable markup into the rendered block.
      const highlighted = hljs.highlight(code, { language }).value;
      codeRef.current.innerHTML = DOMPurify.sanitize(highlighted);
    }
  }, [code, language]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div className="my-3 rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden bg-[#0a0a0f]">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2",
          "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px]",
          "border-b border-[rgba(255,255,255,0.06)]"
        )}
      >
        <div className="flex items-center gap-2">
          <FileCode size={13} className="text-[#06b6d4]" />
          {/* Language badge */}
          <span
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-mono font-medium",
              "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px]",
              "border border-[rgba(255,255,255,0.08)]",
              "text-[#a1a1aa]"
            )}
          >
            {lang}
          </span>
          {filename && (
            <span className="text-[11px] text-[#52525b] font-mono truncate max-w-[200px]">
              {filename}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Apply button */}
          <button
            onClick={() => {
              /* apply hook placeholder */
            }}
            title="Apply code"
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium",
              "text-[#06b6d4] hover:bg-[rgba(6,182,212,0.1)] transition-all duration-150"
            )}
          >
            <Play size={10} />
            Apply
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="Copy code"
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-150",
              copied
                ? "text-emerald-400"
                : "text-[#71717a] hover:text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.04)]"
            )}
          >
            {copied ? (
              <>
                <Check size={10} className="text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy size={10} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto">
        <pre className="p-0 m-0">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr
                  key={i}
                  className="hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-100"
                >
                  {/* Line number */}
                  <td className="w-12 text-right pr-4 pl-4 py-0 text-[11px] text-[rgba(255,255,255,0.15)] select-none font-mono align-top leading-6 border-r border-[rgba(255,255,255,0.04)]">
                    {i + 1}
                  </td>
                  {/* Code */}
                  <td className="pl-4 pr-4 py-0 align-top leading-6">
                    <code
                      ref={i === 0 ? codeRef : undefined}
                      className="text-[12px] font-mono text-[#e4e4e7]"
                    >
                      {line || "\u00A0"}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </pre>
      </div>
    </div>
  );
}
