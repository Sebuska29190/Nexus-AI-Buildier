import { useState, useEffect, useCallback, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { FolderGit2, File, FilePlus, Save, Trash2, ChevronRight, ChevronDown, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "../lib/components/ui/ConfirmDialog";

interface FileNode {
  path: string;
  type: "file" | "dir";
  children?: FileNode[];
}

export function CodeEditorPage() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["/"]));
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadTree = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/tree");
      if (!res.ok) throw new Error("Workspace not accessible");
      const data = await res.json();
      setFiles(buildTree(data.files || []));
    } catch (e: any) {
      setMessage({ text: `Failed to load: ${e.message}`, type: "error" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    loadTree();
    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [loadTree]);

  function buildTree(paths: string[]): FileNode[] {
    const root: FileNode[] = [];
    for (const p of paths) {
      const parts = p.split("/");
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1;
        const nodePath = parts.slice(0, i + 1).join("/");
        const existing = current.find(n => n.path === nodePath);
        if (existing) {
          if (!isLast && !existing.children) existing.children = [];
          current = existing.children || current;
        } else {
          const node: FileNode = { path: nodePath, type: isLast ? "file" : "dir" };
          if (!isLast) node.children = [];
          current.push(node);
          if (!isLast && node.children) current = node.children;
        }
      }
    }
    return root;
  }

  async function loadFile(path: string) {
    try {
      const res = await fetch(`/api/workspace/read?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSelectedFile(path);
      setContent(data.content || "");
      setOriginalContent(data.content || "");
    } catch (e: any) {
      setMessage({ text: `Error: ${e.message}`, type: "error" });
    }
  }

  async function saveFile() {
    if (!selectedFile) return;

    // Zadanie 4: Walidacja przed zapisem
    if (content === null || content === undefined || content.trim() === "") {
      setMessage({ text: "Cannot save empty file. Add some content first.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/workspace/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedFile, content }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed (${res.status})`);
      }
      setOriginalContent(content);
      setMessage({ text: "✓ Saved", type: "success" });
      setTimeout(() => setMessage(null), 2000);
    } catch (e: any) {
      setMessage({ text: `Save failed: ${e.message}`, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function createFile() {
    const name = prompt("File path (relative to workspace root):");
    if (!name) return;
    try {
      const res = await fetch("/api/workspace/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: name, content: "" }),
      });
      if (!res.ok) throw new Error("Create failed");
      setMessage({ text: `Created ${name}`, type: "success" });
      setTimeout(() => setMessage(null), 2000);
      loadTree();
      loadFile(name);
    } catch (e: any) {
      setMessage({ text: `Create failed: ${e.message}`, type: "error" });
    }
  }

  async function deleteFile(path: string) {
    setConfirmDeletePath(path);
  }

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Ctrl+S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (content !== originalContent) saveFile();
    });
  };

  const getLanguage = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase() || "";
    const map: Record<string, string> = {
      ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
      py: "python", rs: "rust", go: "go", java: "java", cpp: "cpp", c: "c",
      h: "c", hpp: "cpp", css: "css", scss: "scss", html: "html", json: "json",
      yaml: "yaml", yml: "yaml", md: "markdown", sql: "sql", sh: "shell",
      bash: "shell", toml: "plaintext", xml: "xml",
    };
    return map[ext] || "plaintext";
  };

  const renderTree = (nodes: FileNode[], depth = 0) => (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <li key={node.path}>
          {node.type === "dir" ? (
            <div>
              <button
                className="flex items-center gap-1 w-full text-left px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all"
                onClick={() => {
                  setExpandedDirs(prev => {
                    const next = new Set(prev);
                    next.has(node.path) ? next.delete(node.path) : next.add(node.path);
                    return next;
                  });
                }}
                aria-label={expandedDirs.has(node.path) ? `Collapse ${node.path.split("/").pop()}` : `Expand ${node.path.split("/").pop()}`}
              >
                {expandedDirs.has(node.path) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <FolderGit2 size={12} className="text-indigo-400 shrink-0" />
                <span className="truncate">{node.path.split("/").pop()}</span>
              </button>
              {expandedDirs.has(node.path) && node.children && renderTree(node.children, depth + 1)}
            </div>
          ) : (
            <button
              className={`flex items-center gap-1.5 w-full text-left px-2 py-0.5 rounded text-[11px] transition-all ${
                selectedFile === node.path
                  ? "bg-[rgba(99,102,241,0.12)] text-white"
                  : "text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
              }`}
              style={{ paddingLeft: `${(depth + 1) * 12}px` }}
              onClick={() => loadFile(node.path)}
              aria-label={`Open ${node.path.split("/").pop()}`}
            >
              <File size={12} className="shrink-0" />
              <span className="truncate">{node.path.split("/").pop()}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  const isModified = content !== originalContent;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(18,18,26,0.95)] shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white">Code Editor</h2>
          {message && (
            <span role="alert" className={`text-[10px] px-2 py-0.5 rounded ${
              message.type === "success" ? "bg-emerald-950/50 text-emerald-400" : "bg-red-950/50 text-red-400"
            }`}>
              {message.text}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={createFile} className="btn-nova px-2 py-1 rounded text-[10px] flex items-center gap-1" title="New file" aria-label="Create new file">
            <FilePlus size={12} /> New
          </button>
          <button onClick={loadTree} className="btn-nova px-2 py-1 rounded text-[10px] flex items-center gap-1" title="Refresh tree" aria-label="Refresh file tree">
            <RefreshCw size={12} /> Refresh
          </button>
          {selectedFile && (
            <button onClick={saveFile} disabled={!isModified || saving}
              className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-all ${
                isModified
                  ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
              }`}
              aria-label="Save file">
              <Save size={12} /> {saving ? "Saving..." : "Save"}
            </button>
          )}
          {selectedFile && (
            <button onClick={() => deleteFile(selectedFile)} className="px-2 py-1 rounded text-[10px] flex items-center gap-1 bg-red-950/40 text-red-400 hover:bg-red-900/40" aria-label="Delete file">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree */}
        <div className="w-56 shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.8)] overflow-y-auto p-2">
          {loading ? (
            <div className="text-[11px] text-slate-500 p-2">Loading...</div>
          ) : files.length === 0 ? (
            <div className="text-[11px] text-slate-500 p-2 text-center mt-8">
              <FolderGit2 size={24} className="mx-auto mb-2 text-slate-700" />
              <p>No files found</p>
              <p className="text-[10px] text-slate-600 mt-1">Set workspace folder first</p>
            </div>
          ) : (
            renderTree(files)
          )}
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          {selectedFile ? (
            <Editor
              height="100%"
              language={getLanguage(selectedFile)}
              value={content}
              onChange={(val) => setContent(val || "")}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                renderWhitespace: "selection",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                padding: { top: 8 },
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
              <FolderGit2 size={32} className="text-slate-700" />
              <p className="text-xs">Select a file from the tree to start editing</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!confirmDeletePath}
        title="Delete File"
        message={`Are you sure you want to delete "${confirmDeletePath}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          const path = confirmDeletePath;
          setConfirmDeletePath(null);
          if (!path) return;
          try {
            const delRes = await fetch("/api/workspace/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path }),
            });
            if (!delRes.ok) throw new Error("Delete failed");
            setMessage({ text: `Deleted ${path}`, type: "success" });
            setTimeout(() => setMessage(null), 2000);
            if (selectedFile === path) { setSelectedFile(null); setContent(""); }
            loadTree();
          } catch (e: any) {
            setMessage({ text: `Delete failed: ${e.message}`, type: "error" });
          }
        }}
        onCancel={() => setConfirmDeletePath(null)}
      />
    </div>
  );
}
