import {
  MessageSquare, Users, Zap, Brain, Terminal, Settings, MoreHorizontal
} from "lucide-react";

interface MobileNavProps {
  route: string;
  onRoute: (r: string) => void;
}

const mobileNavItems = [
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "agents", icon: Users, label: "Agents" },
  { id: "skills", icon: Zap, label: "Skills" },
  { id: "memory", icon: Brain, label: "Memory" },
  { id: "terminal", icon: Terminal, label: "Terminal" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export function MobileNav({ route, onRoute }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[rgba(18,18,26,0.95)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.06)] md:hidden">
      <div className="flex items-center justify-around px-2 py-1.5">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = route === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onRoute(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                isActive
                  ? "text-[#818cf8] bg-[rgba(99,102,241,0.1)]"
                  : "text-[#475569] hover:text-[#94a3b8]"
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
