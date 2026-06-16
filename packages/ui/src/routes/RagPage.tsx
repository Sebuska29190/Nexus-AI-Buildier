import { useState, useEffect, useRef } from "react";

interface RagDoc {
  id: string; filename: string; title?: string;
  type: string; size: number; chunkCount: number;
  status: string; error?: string; createdAt: string;
}

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
  const fileInput = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => { load(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/rag/documents");
      if (res.ok) setDocs((await res.json()).documents || []);
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
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await fetch("/api/rag/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(errBody || `HTTP ${res.status}`);
      }
      setSuccessMsg(`📄 ${files[0].name} uploaded — processing chunks...`);
      await load();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e: any) { setErrorMsg("Upload failed: " + (e.message || e)); }
  }

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
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#4facfe]/20 border border-[#6366f1]/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">RAG Knowledge Base</h2>
            <p className="text-[10px] text-[#475569]">Upload documents, ask questions — AI searches your knowledge</p>
          </div>
        </div>
        <button onClick={() => fileInput.current?.click()} className="btn-nova px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload Document
        </button>
        <input ref={fileInput} type="file" accept=".txt,.md,.pdf,.csv,.json" className="hidden" onChange={(e) => uploadFile(e.target.files)} />
      </div>

      {errorMsg && <div className="glass-panel rounded-xl p-3 mb-4 border border-red-500/30 bg-red-950/20"><p className="text-[11px] text-red-400">{errorMsg}</p></div>}
      {successMsg && <div className="glass-panel rounded-xl p-3 mb-4 border border-emerald-500/30 bg-emerald-950/20"><p className="text-[11px] text-emerald-400">{successMsg}</p></div>}

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Documents */}
        <div className="col-span-4">
          <div className="glass-panel rounded-xl p-4 border border-[rgba(255,255,255,0.06)]/60">
            <h3 className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-medium mb-3">Documents ({docs.length})</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8"><span className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"></span></div>
            ) : docs.length === 0 ? (
              <div className="text-center py-8"><svg className="w-8 h-8 text-slate-700 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p className="text-[11px] text-[#475569]">No documents yet</p><p className="text-[9px] text-slate-700 mt-1">Upload .txt, .md, .pdf, .csv or .json</p></div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {docs.map((doc) => (
                  <div key={doc.id}
                    onClick={() => viewDoc(doc)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${
                      selectedDoc?.id === doc.id ? "bg-[#6366f1]/10 border-[#6366f1]/40" : "bg-slate-900/40 border-[rgba(255,255,255,0.06)]/40 hover:border-slate-700"
                    }`}>
                    <span className="text-sm">{doc.type === "pdf" ? "📕" : doc.type === "md" ? "📝" : "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white truncate font-medium">{doc.filename}</p>
                      <div className="flex items-center gap-2 text-[8px] text-[#475569]">
                        <span>{(doc.size / 1024).toFixed(0)}KB</span>
                        <span>{doc.chunkCount} chunks</span>
                        {doc.status === "processing" && <span className="text-amber-400 animate-pulse">⏳</span>}
                        {doc.status === "ready" && <span className="text-emerald-400">✅</span>}
                        {doc.status === "error" && <span className="text-red-400">❌</span>}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                      className="text-[#475569] hover:text-red-400 text-[9px]">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Query + Content */}
        <div className="col-span-8 space-y-4">
          {/* Query */}
          <div className="glass-panel rounded-xl p-4 border border-[rgba(255,255,255,0.06)]/60">
            <h3 className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-medium mb-3">Ask your documents</h3>
            <div className="flex gap-2">
              <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && query()}
                placeholder="Ask anything about your documents..."
                className="flex-1 bg-slate-900/60 border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600" />
              <button onClick={query} disabled={querying || !question.trim()}
                className="btn-nova px-4 py-2 rounded-lg text-xs disabled:opacity-40 flex items-center gap-1.5">
                {querying ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Ask"}
              </button>
            </div>
            {answer && (
              <div className="mt-3 bg-slate-900/60 border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
                <p className="text-[10px] text-[#94a3b8] mb-1">Answer:</p>
                <p className="text-xs text-white whitespace-pre-wrap">{answer}</p>
              </div>
            )}
          </div>

          {/* Document Content */}
          {selectedDoc && (
            <div className="glass-panel rounded-xl p-4 border border-[rgba(255,255,255,0.06)]/60">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-medium">📄 {selectedDoc.filename}</h3>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  selectedDoc.status === "ready" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                }`}>{selectedDoc.status}</span>
              </div>
              <div className="max-h-96 overflow-y-auto bg-slate-950/60 rounded-lg p-3">
                <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-sans">{docContent.slice(0, 5000)}{docContent.length > 5000 ? "\n\n... (truncated)" : ""}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
