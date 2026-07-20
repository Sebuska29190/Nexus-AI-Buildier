/**
 * WelcomeScreen — Premium empty state with action cards
 */
import { Hexagon } from "lucide-react";

interface WelcomeScreenProps { onSelectPrompt: (text: string) => void; }

const ACTION_CARDS = [
  { icon: "💻", label: "Code Review", prompt: "Review the code in this project for bugs, security issues, and improvements" },
  { icon: "🔍", label: "Analyze Project", prompt: "Analyze the project structure and provide a comprehensive overview" },
  { icon: "📝", label: "Write Docs", prompt: "Write comprehensive documentation for this project" },
  { icon: "🐛", label: "Debug Bug", prompt: "Investigate and fix the reported bug in this codebase" },
  { icon: "🧪", label: "Write Tests", prompt: "Write unit tests for the core functions in this project" },
  { icon: "🤖", label: "Agent Task", prompt: "Orchestrate multiple agents to complete a complex task" },
];

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="w-20 h-20 rounded-md bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center mx-auto mb-6 shadow-[0_0_48px_rgba(245,158,11,0.2)]">
          <Hexagon className="w-9 h-9 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold mb-2 font-[Clash_Display,Inter,sans-serif]">
          <span className="bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] bg-clip-text text-transparent">AgentForge</span>
        </h1>
        <p className="text-[#A1A1AA] text-sm mb-10">Connect. Create. Automate. — Your connected AI agent platform.</p>

        {/* Action Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {ACTION_CARDS.map(card => (
            <button
              key={card.label}
              onClick={() => onSelectPrompt(card.prompt)}
              className="flex flex-col items-center gap-3 p-5 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.03)] hover:shadow-[0_0_24px_rgba(245,158,11,0.06)] transition-all duration-300 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{card.icon}</span>
              <span className="text-xs font-medium text-[#A1A1AA] group-hover:text-[#E4E4E7] transition-colors">{card.label}</span>
            </button>
          ))}
        </div>

        {/* Tip */}
        <p className="text-[10px] text-[#71717A]">
          Type <code className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#F59E0B] font-mono">/</code> for commands · 
          <code className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#F59E0B] font-mono ml-1">@</code> to mention agents · 
          Drag & drop files to attach
        </p>
      </div>
    </div>
  );
}
