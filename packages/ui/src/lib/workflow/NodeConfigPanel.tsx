import { X } from "lucide-react";

interface NodeConfigPanelProps {
  node: any;
  onUpdate: (id: string, data: Record<string, any>) => void;
  onDelete: (id: string) => void;
}

export function NodeConfigPanel({ node, onUpdate, onDelete }: NodeConfigPanelProps) {
  if (!node) return null;

  const typeConfig: Record<string, { fields: { key: string; label: string; type: string; placeholder?: string }[] }> = {
    start: { fields: [{ key: "label", label: "Label", type: "text", placeholder: "Start" }] },
    agent: { fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Agent name" },
      { key: "agentId", label: "Agent ID", type: "text", placeholder: "e.g. code-reviewer" },
      { key: "message", label: "Message", type: "textarea", placeholder: "Task message..." },
    ]},
    tool: { fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Tool name" },
      { key: "toolName", label: "Tool Name", type: "text", placeholder: "e.g. web_search" },
      { key: "arguments", label: "Arguments (JSON)", type: "textarea", placeholder: '{"query": "..."}' },
    ]},
    condition: { fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Condition" },
      { key: "variable", label: "Variable", type: "text", placeholder: "e.g. result.status" },
      { key: "operator", label: "Operator", type: "select", placeholder: "" },
      { key: "value", label: "Value", type: "text", placeholder: "e.g. success" },
    ]},
    delay: { fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Delay" },
      { key: "ms", label: "Delay (ms)", type: "number", placeholder: "1000" },
    ]},
    notify: { fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Notify" },
      { key: "message", label: "Message", type: "textarea", placeholder: "Notification text..." },
    ]},
    end: { fields: [{ key: "label", label: "Label", type: "text", placeholder: "End" }] },
  };

  const config = typeConfig[node.type] || typeConfig.agent;
  const operators = ["equals", "not equals", "contains", "gt", "lt", "exists"];

  return (
    <div className="glass-card p-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white">Configure: {node.type}</h3>
        <button onClick={() => onDelete(node.id)} className="text-[#475569] hover:text-[#ef4444] transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {config.fields.map((f) => (
          <div key={f.key}>
            <label className="text-[10px] font-medium text-[#94a3b8] mb-1 block">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea
                value={node.data[f.key] || ""}
                onChange={(e) => onUpdate(node.id, { ...node.data, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                rows={3}
                className="glass-input w-full px-3 py-2 text-xs resize-none"
              />
            ) : f.type === "select" && f.key === "operator" ? (
              <select
                value={node.data[f.key] || "equals"}
                onChange={(e) => onUpdate(node.id, { ...node.data, [f.key]: e.target.value })}
                className="glass-input w-full px-3 py-2 text-xs"
              >
                {operators.map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
            ) : (
              <input
                type={f.type}
                value={node.data[f.key] || ""}
                onChange={(e) => onUpdate(node.id, { ...node.data, [f.key]: f.type === "number" ? parseInt(e.target.value) || 0 : e.target.value })}
                placeholder={f.placeholder}
                className="glass-input w-full px-3 py-2 text-xs"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
        <p className="text-[9px] text-[#475569]">
          ID: <span className="font-mono">{node.id}</span>
        </p>
      </div>
    </div>
  );
}
