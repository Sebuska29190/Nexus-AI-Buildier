import React, { useState } from "react";

interface GlassTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; count?: number }[];
  activeTab?: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function GlassTabs({ tabs, activeTab: controlledTab, onChange, className = "" }: GlassTabsProps) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id || "");
  const activeTab = controlledTab ?? internalTab;

  function handleChange(tabId: string) {
    setInternalTab(tabId);
    onChange(tabId);
  }

  return (
    <div className={`flex gap-1 p-1 bg-[rgba(255,255,255,0.03)] rounded-xl border border-[rgba(255,255,255,0.06)] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-[rgba(99,102,241,0.12)] text-[#818cf8] shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                : "text-[#475569] hover:text-[#94a3b8] hover:bg-[rgba(255,255,255,0.03)]"
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                isActive
                  ? "bg-[rgba(99,102,241,0.15)] text-[#a5b4fc]"
                  : "bg-[rgba(255,255,255,0.05)] text-[#475569]"
              }`}>
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-0 rounded-lg border border-[rgba(99,102,241,0.2)] pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
}
