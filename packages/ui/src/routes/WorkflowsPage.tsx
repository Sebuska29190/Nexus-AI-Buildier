import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState, Connection, Node, Edge,
  BackgroundVariant, Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch, Save, Play, Trash2, Plus, ArrowLeft, Workflow } from "lucide-react";
import { GlassCard } from "../lib/components/ui/GlassCard";
import { GlassButton } from "../lib/components/ui/GlassButton";
import { GlassInput } from "../lib/components/ui/GlassInput";
import { GlassBadge } from "../lib/components/ui/GlassBadge";
import { AgentNode } from "../lib/workflow/nodes/AgentNode";
import { ToolNode } from "../lib/workflow/nodes/ToolNode";
import { ConditionNode } from "../lib/workflow/nodes/ConditionNode";
import { StartNode } from "../lib/workflow/nodes/StartNode";
import { EndNode } from "../lib/workflow/nodes/EndNode";
import { GlassEdge } from "../lib/workflow/edges/GlassEdge";
import { NodePalette } from "../lib/workflow/NodePalette";
import { NodeConfigPanel } from "../lib/workflow/NodeConfigPanel";

const nodeTypes = { agent: AgentNode, tool: ToolNode, condition: ConditionNode, start: StartNode, end: EndNode };
const edgeTypes = { glass: GlassEdge };

const defaultViewport = { x: 50, y: 50, zoom: 0.85 };

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([
    { id: "start-1", type: "start", position: { x: 250, y: 0 }, data: { label: "Start" } },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    fetch("/api/workflows").then(r => r.ok && r.json()).then(d => d && setWorkflows(d.workflows || [])).catch(() => {});
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: "glass", animated: true }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  function addNode(type: string, defaults: Record<string, any>) {
    const id = `${type}-${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const position = { x: lastNode ? lastNode.position.x + (Math.random() * 100 - 50) : 250, y: lastNode ? lastNode.position.y + 150 : 100 };
    const newNode: Node = { id, type, position, data: { ...defaults } };
    setNodes((nds) => [...nds, newNode]);
  }

  function updateNodeData(id: string, data: Record<string, any>) {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data } : n));
    setSelectedNode((prev: any) => prev?.id === id ? { ...prev, data } : prev);
  }

  function deleteNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode(null);
  }

  async function saveWorkflow() {
    const steps = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.data.label || n.type,
      config: n.data,
    }));
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workflowName, steps, nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })), edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, type: "glass" })) }),
    });
    if (res.ok) {
      const data = await res.json();
      setEditingId(data.id);
      fetch("/api/workflows").then(r => r.json()).then(d => setWorkflows(d.workflows || []));
    }
  }

  async function loadWorkflow(w: any) {
    setEditingId(w.id);
    setWorkflowName(w.name);
    if (w.nodes?.length) {
      setNodes(w.nodes);
      setEdges(w.edges || []);
    } else {
      // Convert old step format to nodes
      const convertedNodes: Node[] = [
        { id: "start-1", type: "start", position: { x: 250, y: 0 }, data: { label: "Start" } },
      ];
      const convertedEdges: Edge[] = [];
      (w.steps || []).forEach((step: any, i: number) => {
        const nodeId = step.id || `step-${i}`;
        convertedNodes.push({
          id: nodeId, type: step.type || "agent",
          position: { x: 250, y: (i + 1) * 150 },
          data: { label: step.label || step.type, ...step.config },
        });
        convertedEdges.push({
          id: `e-${i}`, source: i === 0 ? "start-1" : (w.steps[i - 1]?.id || `step-${i - 1}`),
          target: nodeId, type: "glass", animated: true,
        });
      });
      setNodes(convertedNodes);
      setEdges(convertedEdges);
    }
    setShowList(false);
  }

  function newWorkflow() {
    setEditingId(null);
    setWorkflowName("New Workflow");
    setNodes([{ id: "start-1", type: "start", position: { x: 250, y: 0 }, data: { label: "Start" } }]);
    setEdges([]);
    setSelectedNode(null);
    setShowList(false);
  }

  async function deleteWorkflow(id: string) {
    if (!confirm("Delete this workflow?")) return;
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    fetch("/api/workflows").then(r => r.json()).then(d => setWorkflows(d.workflows || []));
  }

  async function runWorkflow(id: string) {
    await fetch(`/api/workflows/${id}/run`, { method: "POST" });
    fetch("/api/workflows").then(r => r.json()).then(d => setWorkflows(d.workflows || []));
  }

  // Workflow list view
  if (showList) {
    return (
      <div className="max-w-6xl mx-auto w-full animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Workflow size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Workflows</h1>
              <p className="text-xs text-[#475569]">Chain agents, tools, and conditions visually</p>
            </div>
          </div>
          <GlassButton variant="primary" icon={<Plus size={14} />} onClick={newWorkflow}>
            New Workflow
          </GlassButton>
        </div>

        {workflows.length === 0 ? (
          <GlassCard padding="lg" className="text-center">
            <GitBranch size={32} className="mx-auto mb-3 text-[#475569]" />
            <p className="text-sm text-[#94a3b8] mb-3">No workflows yet</p>
            <GlassButton variant="primary" size="sm" onClick={newWorkflow}>Create your first workflow</GlassButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((w) => (
              <GlassCard key={w.id} padding="md" className="cursor-pointer" onClick={() => loadWorkflow(w)}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white font-medium">{w.name}</p>
                  <GlassBadge variant={w.status === "active" ? "success" : "default"}>
                    {w.status || "draft"}
                  </GlassBadge>
                </div>
                <p className="text-[10px] text-[#475569] mb-3">{w.description || `${(w.steps || []).length} steps`}</p>
                <div className="flex items-center gap-1 mb-3">
                  {(w.steps || []).slice(0, 5).map((s: any, i: number) => (
                    <GlassBadge key={i} variant="default">{s.type}</GlassBadge>
                  ))}
                  {(w.steps || []).length > 5 && <span className="text-[9px] text-[#475569]">+{(w.steps || []).length - 5}</span>}
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <GlassButton variant="ghost" size="sm" icon={<Play size={10} />} onClick={() => runWorkflow(w.id)}>Run</GlassButton>
                  <GlassButton variant="ghost" size="sm" icon={<Trash2 size={10} />} onClick={() => deleteWorkflow(w.id)}>Delete</GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Visual editor view
  return (
    <div className="h-[calc(100dvh-8rem)] flex gap-4 animate-fade-in-up">
      {/* Left: Node Palette */}
      <div className="w-56 flex flex-col gap-4 shrink-0">
        <GlassButton variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => setShowList(true)}>
          Back to list
        </GlassButton>
        <NodePalette onAddNode={addNode} />

        {/* Workflow name */}
        <GlassCard padding="md">
          <label className="text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">Workflow Name</label>
          <GlassInput
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="My workflow..."
          />
          <div className="flex gap-2 mt-3">
            <GlassButton variant="primary" size="sm" icon={<Save size={12} />} onClick={saveWorkflow} className="flex-1">
              Save
            </GlassButton>
          </div>
        </GlassCard>

        {/* Selected node config */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={updateNodeData}
            onDelete={deleteNode}
          />
        )}

        {/* Stats */}
        <div className="text-[9px] text-[#475569] space-y-1">
          <p>Nodes: {nodes.length}</p>
          <p>Edges: {edges.length}</p>
        </div>
      </div>

      {/* Right: React Flow Canvas */}
      <div className="flex-1 glass-card overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultViewport={defaultViewport}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          className="bg-[#0a0a0f]"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(99,102,241,0.08)" />
          <Controls className="!bg-[#12121a] !border !border-[rgba(255,255,255,0.08)] !rounded-xl !shadow-[0_8px_32px_rgba(0,0,0,0.4)]" />
          <MiniMap
            nodeColor={(n) => {
              switch (n.type) {
                case "start": return "#6366f1";
                case "agent": return "#818cf8";
                case "tool": return "#22c55e";
                case "condition": return "#f59e0b";
                case "end": return "#ef4444";
                default: return "#475569";
              }
            }}
            maskColor="rgba(10,10,15,0.8)"
            className="!bg-[#12121a] !border !border-[rgba(255,255,255,0.08)] !rounded-xl"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
