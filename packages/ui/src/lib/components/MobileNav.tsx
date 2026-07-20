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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111113] border-t border-[rgba(255,255,255,0.06)] md:hidden">
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
                  ? "text-[#F59E0B] bg-[rgba(245,158,11,0.1)]"
                  : "text-[#71717A] hover:text-[#A1A1AA]"
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
