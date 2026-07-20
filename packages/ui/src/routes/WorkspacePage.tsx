import { useState, useEffect } from "react";
import { FolderGit2 } from "lucide-react";

export function WorkspacePage() {
  const [rootDir, setRootDir] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWorkspace(); }, []);

  async function loadWorkspace() {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/status");
      if (res.ok) {
        const data = await res.json();
        if (data.rootDir) setRootDir(data.rootDir);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FolderGit2 size={20} className="text-[#FCD34D]" />
        <h1 className="text-lg font-bold">Workspace</h1>
      </div>

      <div className="glass-card p-6 rounded-xl space-y-4">
        {loading ? (
          <div className="text-[#71717A]">Loading...</div>
        ) : rootDir ? (
          <div className="space-y-3">
            <div className="text-xs text-[#71717A]">Root directory:</div>
            <div className="font-mono text-sm text-white bg-[rgba(0,0,0,0.3)] p-3 rounded-lg">{rootDir}</div>
          </div>
        ) : (
          <div className="text-center text-[#71717A] py-4">
            No workspace configured. The agent uses the server's working directory.
          </div>
        )}
      </div>
    </div>
  );
}
