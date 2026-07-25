import { motion } from "framer-motion";
import {
  MessageSquare, Users, Terminal, Settings,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "../utils";
import { isActiveRoute } from "../utils/routeAliases";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MobileNavProps {
  route: string;
  onRoute: (r: string) => void;
  badgeCounts?: Record<string, number>;
}

interface MobileNavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

// ─── Navigation items (5 max) ────────────────────────────────────────────────

const mobileNavItems: MobileNavItem[] = [
  { id: "chat",     icon: MessageSquare,  label: "Chat" },
  { id: "agentconfig", icon: Users,       label: "Agents" },
  { id: "terminal", icon: Terminal,        label: "Terminal" },
  { id: "settings", icon: Settings,        label: "Settings" },
  { id: "more",     icon: MoreHorizontal,  label: "More" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function MobileNav({ route, onRoute, badgeCounts }: MobileNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-[rgba(17,17,20,0.7)] backdrop-blur-xl",
        "border-t border-[rgba(255,255,255,0.06)]",
        "safe-bottom"
      )}
    >
      <div className="flex items-center justify-around px-1 py-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.id, route);
          const badge = badgeCounts?.[item.id];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onRoute(item.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl",
                "transition-colors duration-200 min-w-[52px]",
                isActive
                  ? "text-[#06b6d4]"
                  : "text-[#71717A] active:text-[#A1A1AA]"
              )}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-xl bg-[rgba(6,182,212,0.08)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon size={18} />

                {/* Badge count */}
                {typeof badge === "number" && badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "absolute -top-1 -right-2 min-w-[14px] h-[14px] flex items-center justify-center",
                      "text-[8px] font-bold font-mono rounded-full",
                      "bg-[#06b6d4] text-[#0a0a0b] px-0.5"
                    )}
                  >
                    {badge > 99 ? "99+" : badge}
                  </motion.span>
                )}
              </div>

              <span
                className={cn(
                  "text-[9px] font-medium relative z-10",
                  isActive ? "text-[#06b6d4]" : "text-[#71717A]"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
