/**
 * WelcomeScreen — Empty chat welcome state with gradient branding
 * and quick-action glass cards for common tasks.
 */
import { motion } from "framer-motion";
import {
  Code2,
  Search,
  FileText,
  Bug,
  TestTube2,
  BotMessageSquare,
} from "lucide-react";
import { cn } from "../../utils";
import { staggerContainer, staggerItem } from "../../motion";

export interface WelcomeScreenProps {
  onAction: (message: string) => void;
}

interface ActionCard {
  icon: React.ElementType;
  label: string;
  prompt: string;
  color: string;
}

const ACTION_CARDS: ActionCard[] = [
  {
    icon: Code2,
    label: "Code Review",
    prompt: "Review the code in this project for bugs, security issues, and improvements",
    color: "#06b6d4",
  },
  {
    icon: Search,
    label: "Analyze Project",
    prompt: "Analyze the project structure and provide a comprehensive overview",
    color: "#8b5cf6",
  },
  {
    icon: FileText,
    label: "Write Docs",
    prompt: "Write comprehensive documentation for this project",
    color: "#06b6d4",
  },
  {
    icon: Bug,
    label: "Debug Bug",
    prompt: "Investigate and fix the reported bug in this codebase",
    color: "#f43f5e",
  },
  {
    icon: TestTube2,
    label: "Write Tests",
    prompt: "Write unit tests for the core functions in this project",
    color: "#10b981",
  },
  {
    icon: BotMessageSquare,
    label: "Agent Task",
    prompt: "Orchestrate multiple agents to complete a complex task",
    color: "#8b5cf6",
  },
];

export function WelcomeScreen({ onAction }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
      <div className="text-center max-w-2xl w-full">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="mb-8"
        >
          <div
            className={cn(
              "w-20 h-20 rounded-2xl mx-auto mb-6",
              "bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6]",
              "flex items-center justify-center",
              "shadow-[0_0_64px_rgba(6,182,212,0.2),0_0_32px_rgba(139,92,246,0.15)]"
            )}
          >
            <span className="text-3xl font-bold text-white tracking-tight">AF</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span
              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent"
            >
              AgentForge
            </span>
          </h1>
          <p className="text-[#71717a] text-sm">
            Your AI coding assistant
          </p>
        </motion.div>

        {/* Action cards grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
        >
          {ACTION_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.label}
                variants={staggerItem}
                onClick={() => onAction(card.prompt)}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-xl group",
                  "bg-[rgba(17,17,20,0.6)] backdrop-blur-[24px]",
                  "border border-[rgba(255,255,255,0.06)]",
                  "hover:border-[rgba(255,255,255,0.12)]",
                  "hover:bg-[rgba(17,17,20,0.85)]",
                  "transition-all duration-300"
                )}
                style={{
                  ["--card-glow" as string]: card.color,
                }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    "transition-all duration-300",
                    "group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${card.color}15, ${card.color}08)`,
                  }}
                >
                  <Icon
                    size={20}
                    style={{ color: card.color }}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <span className="text-xs font-medium text-[#a1a1aa] group-hover:text-[#e4e4e7] transition-colors duration-300">
                  {card.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Keyboard hints */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-[10px] text-[#3f3f46]"
        >
          Type{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[#52525b] font-mono">
            /
          </kbd>{" "}
          for commands ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[#52525b] font-mono">
            @
          </kbd>{" "}
          to mention agents · Drag & drop files to attach
        </motion.p>
      </div>
    </div>
  );
}
