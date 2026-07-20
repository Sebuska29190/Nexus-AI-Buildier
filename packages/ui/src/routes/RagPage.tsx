/**
 * RagPage — RAG Knowledge Base with bulk folder upload
 */
import { useState, useEffect, useRef } from "react";
import { BookOpen, Upload, FolderOpen, Search, RefreshCw, FileText, Loader2 } from "lucide-react";

interface RagDoc { id: string; filename: string; type: string; size: number; chunkCount: number; status: string; }
interface UploadProgress { total: number; completed: number; current: string; errors: string[]; }

export function RagPage() {
  const [docs, setDocs] = useState<RagDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [querying, setQuerying] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<RagDoc | null>(null);
  const [docContent, setDocContent] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [docTotal, setDocTotal] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [docSearch, setDocSearch] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => { load(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      if (docSearch) params.set("search", docSearch);
      const res = await fetch(`/api/rag/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
        setDocTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (docs.some((d) => d.status === "processing")) {
      if (!pollRef.current) pollRef.current = setInterval(load, 3000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = undefined; }
    }
  }, [docs]);

  async function uploadFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErrorMsg(""); setSuccessMsg("");
    // Use same batch logic as folder upload for consistency
    await uploadFolder(files);
  }

  // Bulk folder upload
  async function uploadFolder(files: FileList | null) {
    if (!files || files.length === 0) { console.log("[RAG] No files selected"); return; }
    console.log(`[RAG] ${files.length} files selected`);
    setErrorMsg(""); setSuccessMsg("");
    const supported = [".txt", ".md", ".pdf", ".csv", ".json", ".xml", ".html"];
    const validFiles = Array.from(files).filter(f => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      return supported.includes(ext);
    });
    console.log(`[RAG] ${validFiles.length} valid files after filter`);
    if (validFiles.length === 0) { setErrorMsg(`No supported files. Supported: ${supported.join(", ")}`); return; }
    setUploadProgress({ total: validFiles.length, completed: 0, current: "", errors: [] });
    let uploaded = 0;
    let skipped = 0;
    const BATCH_SIZE = 10;
    for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
      const batch = validFiles.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(async (file) => {
        setUploadProgress(prev => prev ? { ...prev, current: file.name, completed: i + batch.indexOf(file) } : null);
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/rag/upload", { method: "POST", body: fd, signal: AbortSignal.timeout(30000) });
        if (!res.ok) { const err = await res.text().catch(() => `HTTP ${res.status}`); throw new Error(err); }
        const data = await res.json();
        if (data.document?.status === "exists") { skipped++; return; }
        uploaded++;
      }));
      results.forEach((r, idx) => {
        if (r.status === "rejected") {
          setUploadProgress(prev => prev ? { ...prev, errors: [...prev.errors, `${batch[idx].name}: ${r.reason}`] } : null);
        }
      });
      setUploadProgress(prev => prev ? { ...prev, completed: Math.min(i + BATCH_SIZE, validFiles.length) } : null);
    }
    setUploadProgress(prev => prev ? { ...prev, completed: validFiles.length } : null);
    const parts = [];
    if (uploaded > 0) parts.push(`${uploaded} uploaded`);
    if (skipped > 0) parts.push(`${skipped} skipped (duplicates)`);
    const msg = `✅ ${parts.join(", ")} from ${validFiles.length} files`;
    console.log(`[RAG] Done: ${msg}`);
    setSuccessMsg(msg);
    await load(); setTimeout(() => setUploadProgress(null), 5000); setTimeout(() => setSuccessMsg(""), 5000);
  }

  // Drag & drop
  const [dragOver, setDragOver] = useState(false);
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); setDragOver(false); }
  function handleDrop(e: React.DragEvent) { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) uploadFolder(e.dataTransfer.files); }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`/api/rag/documents/${id}`, { method: "DELETE" });
      if (selectedDoc?.id === id) { setSelectedDoc(null); setDocContent(""); }
      await load();
    } catch {}
  }

  async function viewDoc(doc: RagDoc) {
    setSelectedDoc(doc);
    try {
      const res = await fetch(`/api/rag/documents/${doc.id}/content`);
      if (res.ok) setDocContent((await res.json()).content || "");
    } catch {}
  }

  async function query() {
    if (!question.trim()) return;
    setQuerying(true); setAnswer(""); setErrorMsg("");
    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnswer(data.answer || "No answer found.");
    } catch (e: any) { setErrorMsg("Query failed: " + (e.message || e)); }
    setQuerying(false);
  }

  return (
    <div className="max-w-6xl mx-auto w-full" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {dragOver && (<div className="fixed inset-0 z-50 bg-[#F59E0B]/5 backdrop-blur-sm flex items-center justify-center pointer-events-none"><div className="bg-[#12121a] border-2 border-dashed border-[#F59E0B]/50 rounded-2xl px-8 py-6 text-center shadow-2xl"><FolderOpen size={32} className="mx-auto mb-2 text-[#F59E0B]" /><p className="text-[#FCD34D] text-lg font-bold mb-1">Drop files or folder here</p><p className="text-[#71717A] text-xs">TXT, MD, PDF, CSV, JSON, XML, HTML</p></div></div>)}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F59E0B] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]"><BookOpen size={20} className="text-white" /></div>
          <div><h1 className="text-xl font-bold text-white">Knowledge Base (RAG)</h1><p className="text-xs text-[#71717A]">Upload documents, ask questions — AI searches your knowledge</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="glass-input px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"><RefreshCw size={14} className="text-[#71717A]" /> Refresh</button>
          <button onClick={() => folderInput.current?.click()} className="glass-input px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"><FolderOpen size={14} className="text-[#F59E0B]" /> Upload Folder</button>
          <button onClick={() => fileInput.current?.click()} className="btn-nova px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"><Upload size={14} /> Upload File</button>
          <input ref={fileInput} type="file" accept=".txt,.md,.pdf,.csv,.json,.xml,.html" multiple className="hidden" onChange={(e) => uploadFile(e.target.files)} />
          <input ref={folderInput} type="file" webkitdirectory="" multiple className="hidden" onChange={(e) => uploadFolder(e.target.files)} />
        </div>
      </div>

      {uploadProgress && (<div className="glass-panel rounded-xl p-4 mb-4 border border-[rgba(255,255,255,0.06)]"><div className="flex items-center justify-between mb-2"><span className="text-xs text-[#A1A1AA]">Uploading {uploadProgress.completed}/{uploadProgress.total} files...</span><span className="text-xs text-[#F59E0B] font-mono">{Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%</span></div><div className="h-2 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#F59E0B] transition-all duration-300" style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }} /></div>{uploadProgress.current && <p className="text-[10px] text-[#71717A] mt-1 truncate">Processing: {uploadProgress.current}</p>}{uploadProgress.errors.length > 0 && <div className="mt-2">{uploadProgress.errors.slice(-3).map((err, i) => <p key={i} className="text-[10px] text-[#ef4444]">✕ {err}</p>)}</div>}</div>)}
      {errorMsg && <div className="glass-panel rounded-xl p-3 mb-4 border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)]"><p className="text-[11px] text-[#ef4444]">{errorMsg}</p></div>}
      {successMsg && <div className="glass-panel rounded-xl p-3 mb-4 border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.05)]"><p className="text-[11px] text-[#22c55e]">{successMsg}</p></div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4"><div className="glass-panel rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-medium mb-3">
            {docTotal > docs.length ? `Documents (${docs.length} of ${docTotal})` : `Documents (${docs.length})`}
          </h3>
          {(docTotal > 100 || docs.length > 50) && (
            <div className="mb-2"><input type="text" value={docSearch} onChange={(e) => { setDocSearch(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search documents..." className="glass-input w-full px-3 py-1.5 text-[10px]" /></div>
          )}
          {loading ? <div className="flex items-center justify-center py-8"><Loader2 size={16} className="text-[#F59E0B] animate-spin" /></div>
          : docs.length === 0 ? <div className="text-center py-8"><FileText size={32} className="mx-auto mb-2 text-[#71717A]" /><p className="text-[11px] text-[#71717A]">No documents yet</p><p className="text-[9px] text-[#71717A] mt-1">Upload files or drop a folder</p></div>
          : (() => {
            const filtered = docSearch ? docs.filter(d => d.filename.toLowerCase().includes(docSearch.toLowerCase())) : docs;
            const displayed = filtered.slice(0, displayLimit);
            return (<div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {displayed.map((doc) => (<div key={doc.id} onClick={() => viewDoc(doc)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${selectedDoc?.id === doc.id ? "bg-[rgba(99,102,241,0.1)] border-[rgba(99,102,241,0.3)]" : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"}`}>
                <span className="text-sm">{doc.type === "pdf" ? "📕" : doc.type === "md" ? "📝" : "📄"}</span>
                <div className="flex-1 min-w-0"><p className="text-[10px] text-white truncate font-medium">{doc.filename}</p><div className="flex items-center gap-2 text-[8px] text-[#71717A]"><span>{(doc.size / 1024).toFixed(0)}KB</span><span>{doc.chunkCount} chunks</span>{doc.status === "processing" && <span className="text-[#f59e0b] animate-pulse">⏳</span>}{doc.status === "ready" && <span className="text-[#22c55e]">✅</span>}{doc.status === "error" && <span className="text-[#ef4444]">❌</span>}</div></div>
                <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }} className="text-[#71717A] hover:text-[#ef4444] text-[9px]">✕</button>
              </div>))}
              {filtered.length < docTotal && (
                <button onClick={async () => { await loadMore(); setDisplayLimit(prev => prev + 50); }} className="w-full py-2 text-[10px] text-[#F59E0B] hover:text-[#FCD34D] transition-colors">
                  Load more ({docTotal - docs.length} remaining)
                </button>
              )}
              {filtered.length >= docs.length && filtered.length > displayLimit && (
                <button onClick={() => setDisplayLimit(prev => prev + 50)} className="w-full py-2 text-[10px] text-[#F59E0B] hover:text-[#FCD34D] transition-colors">
                  Show more ({filtered.length - displayLimit} remaining)
                </button>
              )}
            </div>);
          })()}
        </div></div>
        <div className="col-span-8 space-y-4">
          <div className="glass-panel rounded-xl p-4 border border-[rgba(255,255,255,0.06)]"><h3 className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-medium mb-3">Ask your documents</h3>
            <div className="flex gap-2"><input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && query()} placeholder="Ask anything..." className="glass-input flex-1 px-3 py-2 text-xs" /><button onClick={query} disabled={querying || !question.trim()} className="btn-nova px-4 py-2 rounded-lg text-xs disabled:opacity-40 flex items-center gap-1.5">{querying ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} Ask</button></div>
            {answer && <div className="mt-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3"><p className="text-[10px] text-[#A1A1AA] mb-1">Answer:</p><p className="text-xs text-white whitespace-pre-wrap">{answer}</p></div>}
          </div>
          {selectedDoc && (<div className="glass-panel rounded-xl p-4 border border-[rgba(255,255,255,0.06)]"><div className="flex items-center justify-between mb-2"><h3 className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-medium">📄 {selectedDoc.filename}</h3><span className={`text-[9px] px-1.5 py-0.5 rounded ${selectedDoc.status === "ready" ? "bg-[rgba(34,197,94,0.1)] text-[#22c55e]" : "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]"}`}>{selectedDoc.status}</span></div><div className="max-h-96 overflow-y-auto bg-[rgba(0,0,0,0.3)] rounded-lg p-3"><pre className="text-[10px] text-[#A1A1AA] whitespace-pre-wrap font-sans">{docContent.slice(0, 5000)}{docContent.length > 5000 ? "\n\n... (truncated)" : ""}</pre></div></div>)}
        </div>
      </div>
    </div>
  );
}
