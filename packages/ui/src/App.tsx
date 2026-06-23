import { useState, useEffect, lazy, Suspense } from "react";
import { api } from "./lib/api";
import { Sidebar } from "./lib/components/Sidebar";
import { StatusBar } from "./lib/components/StatusBar";
import { ToastProvider, useToast } from "./lib/components/ui/Toast";
import { ErrorBoundary } from "./lib/ErrorBoundary";
import { MobileNav } from "./lib/components/MobileNav";
import { DashboardPage } from "./routes/DashboardPage"; // Keep as eager load (landing page)

// Lazy loaded pages — split into separate chunks
const ChatPage = lazy(() => import("./routes/ChatPage").then(m => ({ default: m.ChatPage })));
const AgentsPage = lazy(() => import("./routes/AgentsPage").then(m => ({ default: m.AgentsPage })));
const SkillsPage = lazy(() => import("./routes/SkillsPage").then(m => ({ default: m.SkillsPage })));
const SessionsPage = lazy(() => import("./routes/SessionsPage").then(m => ({ default: m.SessionsPage })));
const ModelsPage = lazy(() => import("./routes/ModelsPage").then(m => ({ default: m.ModelsPage })));
const DocsPage = lazy(() => import("./routes/DocsPage").then(m => ({ default: m.DocsPage })));
const TerminalPage = lazy(() => import("./routes/TerminalPage").then(m => ({ default: m.TerminalPage })));
const WorkspacePage = lazy(() => import("./routes/WorkspacePage").then(m => ({ default: m.WorkspacePage })));
const PromptPlaygroundPage = lazy(() => import("./routes/PromptPlaygroundPage").then(m => ({ default: m.PromptPlaygroundPage })));
const MemoryPage = lazy(() => import("./routes/MemoryPage").then(m => ({ default: m.MemoryPage })));
const CodeEditorPage = lazy(() => import("./routes/CodeEditorPage").then(m => ({ default: m.CodeEditorPage })));
const AgentConfigPage = lazy(() => import("./routes/AgentConfigPage").then(m => ({ default: m.AgentConfigPage })));

// Loading fallback
function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(124,58,237,0.3)] border-t-[#7C3AED] animate-spin" />
        <span className="text-[10px] text-[#475569] font-mono">Loading...</span>
      </div>
    </div>
  );
}

// Page component map (lazy)
const pages: Record<string, React.ComponentType<any>> = {
  dashboard: DashboardPage,
  chat: ChatPage,
  agents: AgentsPage,
  skills: SkillsPage,
  sessions: SessionsPage,
  aimodels: ModelsPage,
  docs: DocsPage,
  terminal: TerminalPage,
  workspace: WorkspacePage,
  playground: PromptPlaygroundPage,
  memory: MemoryPage,
  code: CodeEditorPage,
  agentconfig: AgentConfigPage,
};

function AppContent() {
  const [health, setHealth] = useState<any>(null);
  const [models, setModels] = useState<Array<{ id: string }>>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [version, setVersion] = useState("");
  const [connected, setConnected] = useState(false);
  const [route, setRoute] = useState("dashboard");
  const [workspaceName, setWorkspaceName] = useState("");
  const [resumeSessionId, setResumeSessionId] = useState("");
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-chat");
  const { showToast } = useToast();

  async function refresh() {
    try {
      const h = await api.health();
      setHealth(h);
      setVersion(h.version || "4.0.0");
      setConnected(true);
    } catch {
      setConnected(false);
      return;
    }
    try {
      const groupedRes = await fetch("/v1/models");
      if (groupedRes.ok) {
        const data = await groupedRes.json();
        const flatModels: { id: string }[] = (data.data || []).map((m: any) => ({ id: m.id }));
        setModels(flatModels);
      }
    } catch { setModels([]); }
    try { setSessions(await api.sessions()); } catch {}
    try { setSkills(await api.skills()); } catch {}
    try { setAgents(await api.agents()); } catch {}
  }

  function triggerWorkspacePicker() {
    if ("showDirectoryPicker" in window) {
      (window as any).showDirectoryPicker().then((dir: any) => {
        setWorkspaceName(dir.name);
        showToast(`Workspace: ${dir.name}`, "success");
      }).catch(() => {
        showToast("Anulowano wybór katalogu", "info");
      });
    } else {
      showToast("Wybór katalogu niedostępny", "info");
    }
  }

  function handleNewChat() {
    setResumeSessionId("");
    setRoute("chat");
  }

  useEffect(() => {
    const navHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "string") setRoute(detail);
    };
    const resumeHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.sessionId) {
        setResumeSessionId(detail.sessionId);
        setRoute("chat");
      }
    };
    window.addEventListener("nova-navigate", navHandler);
    window.addEventListener("nova-resume-session", resumeHandler);
    refresh();
    const int = setInterval(() => { try { refresh(); } catch {} }, 15000);
    return () => {
      clearInterval(int);
      window.removeEventListener("nova-navigate", navHandler);
      window.removeEventListener("nova-resume-session", resumeHandler);
    };
  }, []);

  const PageComponent = pages[route];

  return (
    <>
      <div className="ambient-glow" />
      <div className="h-dvh max-h-dvh flex bg-[#0a0a0f] text-[#f1f5f9] overflow-hidden relative z-10">
        <Sidebar route={route} onRoute={setRoute} version={version} sessions={sessions} />

        <div className="flex-1 flex flex-col min-w-0">
          {route !== "dashboard" && (
            <StatusBar
              connected={connected}
              version={version || "4.0.0"}
              selectedModel={selectedModel}
              models={models}
              workspaceName={workspaceName}
              onWorkspacePick={triggerWorkspacePicker}
              onModelChange={setSelectedModel}
              onNewChat={handleNewChat}
            />
          )}

          <main className="flex-1 overflow-y-auto relative z-10 animate-fade-in" id="main-content">
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
              {PageComponent ? (
                <PageComponent
                  models={models}
                  skills={skills}
                  agents={agents}
                  sessions={sessions}
                  health={health}
                  connected={connected}
                  onResolved={() => {}}
                  onRefresh={() => refresh()}
                  onSessionChange={() => refresh()}
                  onNavigate={setRoute}
                  sessionKey={route === "chat" ? resumeSessionId : ""}
                  onSessionKeyChange={(key: string) => setResumeSessionId(key)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[#475569] max-w-5xl mx-auto w-full">
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                    <svg className="w-7 h-7 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64l-12.72 12.72"/>
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">W budowie</h2>
                  <p className="text-xs text-[#475569]">Ta sekcja jest w trakcie tworzenia</p>
                </div>
              )}
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <MobileNav route={route} onRoute={setRoute} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
