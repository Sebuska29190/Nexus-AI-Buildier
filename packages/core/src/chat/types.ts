export type ChatEvent =
  | { type: "token"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool_call"; tool: string; args: any; id: string }
  | { type: "tool_result"; tool: string; result: string; duration: number }
  | { type: "approval_request"; id: string; tool: string; args: any }
  | { type: "sub_agent_start"; agentId: string; task: string }
  | { type: "sub_agent_result"; agentId: string; result: string }
  | { type: "sub_agent_error"; agentId: string; error: string }
  | { type: "error"; message: string }
  | { type: "done"; text: string };

export interface TaskPlanItem {
  agentId: string;
  instruction: string;
  dependsOn: number[];
}

export interface TaskPlan {
  reasoning: string;
  tasks: TaskPlanItem[];
}
