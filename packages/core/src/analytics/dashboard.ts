/**
 * Analytics Dashboard — Real metrics and time-series data
 * Uses existing usage tracker data with enhanced aggregation
 */
import { Database } from "bun:sqlite";
import { registerTool } from "../plugin/tools";

const db = new Database("nova.db");

class AnalyticsDashboard {
  async getOverview(): Promise<{
    totalSessions: number;
    totalAgents: number;
    totalTokens: number;
    totalCost: number;
    avgLatency: number;
    successRate: number;
  }> {
    const sessions = (db.query("SELECT COUNT(DISTINCT session_id) as c FROM usage").get() as any)?.c || 0;
    const agents = (db.query("SELECT COUNT(DISTINCT agent_id) as c FROM usage WHERE agent_id IS NOT NULL").get() as any)?.c || 0;
    const tokens = (db.query("SELECT COALESCE(SUM(tokens), 0) as c FROM usage").get() as any)?.c || 0;
    const cost = (db.query("SELECT COALESCE(SUM(cost), 0) as c FROM usage").get() as any)?.c || 0;
    const latency = (db.query("SELECT COALESCE(AVG(duration), 0) as c FROM usage").get() as any)?.c || 0;
    const total = (db.query("SELECT COUNT(*) as c FROM usage").get() as any)?.c || 0;
    const errors = (db.query("SELECT COUNT(*) as c FROM usage WHERE action = 'error'").get() as any)?.c || 0;

    return {
      totalSessions: sessions,
      totalAgents: agents,
      totalTokens: tokens,
      totalCost: cost,
      avgLatency: Math.round(latency * 100) / 100,
      successRate: total > 0 ? Math.round(((total - errors) / total) * 100) : 100,
    };
  }

  async getRequestsOverTime(period: "hour" | "day" | "week" = "day"): Promise<Array<{ time: string; count: number; tokens: number; cost: number }>> {
    let groupBy: string;
    let dateFormat: string;

    switch (period) {
      case "hour":
        groupBy = "strftime('%Y-%m-%d %H:00', created_at)";
        dateFormat = "%Y-%m-%d %H:00";
        break;
      case "week":
        groupBy = "strftime('%Y-W%W', created_at)";
        dateFormat = "%Y-W%W";
        break;
      default:
        groupBy = "strftime('%Y-%m-%d', created_at)";
        dateFormat = "%Y-%m-%d";
    }

    const rows = db.query(`
      SELECT ${groupBy} as time,
             COUNT(*) as count,
             COALESCE(SUM(tokens), 0) as tokens,
             COALESCE(SUM(cost), 0) as cost
      FROM usage
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY ${groupBy}
      ORDER BY time
    `).all() as any[];

    return rows.map(r => ({
      time: r.time,
      count: r.count,
      tokens: r.tokens,
      cost: Math.round(r.cost * 10000) / 10000,
    }));
  }

  async getTopAgents(limit: number = 10): Promise<Array<{ agentId: string; sessions: number; tokens: number; avgLatency: number }>> {
    return db.query(`
      SELECT agent_id as agentId,
             COUNT(DISTINCT session_id) as sessions,
             COALESCE(SUM(tokens), 0) as tokens,
             COALESCE(AVG(duration), 0) as avgLatency
      FROM usage
      WHERE agent_id IS NOT NULL
      GROUP BY agent_id
      ORDER BY sessions DESC
      LIMIT ?
    `).all(limit) as any[];
  }

  async getModelUsage(): Promise<Array<{ model: string; count: number; tokens: number }>> {
    return db.query(`
      SELECT model_ref as model,
             COUNT(*) as count,
             COALESCE(SUM(tokens), 0) as tokens
      FROM usage
      WHERE model_ref IS NOT NULL
      GROUP BY model_ref
      ORDER BY count DESC
      LIMIT 10
    `).all() as any[];
  }

  async getCostForecast(days: number = 7): Promise<{ dailyAvg: number; projected: number; trend: "up" | "down" | "stable" }> {
    const last7 = db.query(`
      SELECT strftime('%Y-%m-%d', created_at) as day, SUM(cost) as daily_cost
      FROM usage
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY day ORDER BY day
    `).all() as any[];

    if (last7.length === 0) return { dailyAvg: 0, projected: 0, trend: "stable" };

    const costs = last7.map((r: any) => r.daily_cost || 0);
    const dailyAvg = costs.reduce((a: number, b: number) => a + b, 0) / costs.length;

    // Simple trend
    let trend: "up" | "down" | "stable" = "stable";
    if (costs.length >= 2) {
      const recent = costs.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
      const earlier = costs.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
      if (recent > earlier * 1.2) trend = "up";
      else if (recent < earlier * 0.8) trend = "down";
    }

    return {
      dailyAvg: Math.round(dailyAvg * 10000) / 10000,
      projected: Math.round(dailyAvg * days * 10000) / 10000,
      trend,
    };
  }
}

export const analyticsDashboard = new AnalyticsDashboard();

// ─── Tools ──────────────────────────────────────────────────
registerTool({
  name: "analytics_overview",
  description: "Get analytics overview: sessions, tokens, cost, latency, success rate",
  parameters: { type: "object", properties: {} },
  async execute() {
    const overview = await analyticsDashboard.getOverview();
    return JSON.stringify(overview, null, 2);
  },
});

registerTool({
  name: "analytics_time_series",
  description: "Get requests over time (hour/day/week)",
  parameters: {
    type: "object",
    properties: { period: { type: "string", description: "hour, day, or week" } },
  },
  async execute(args: { period?: string }) {
    const data = await analyticsDashboard.getRequestsOverTime((args.period as any) || "day");
    return JSON.stringify(data.slice(-20), null, 2);
  },
});

registerTool({
  name: "analytics_top_agents",
  description: "Get top agents by session count",
  parameters: {
    type: "object",
    properties: { limit: { type: "number" } },
  },
  async execute(args: { limit?: number }) {
    const data = await analyticsDashboard.getTopAgents(args.limit || 10);
    return JSON.stringify(data, null, 2);
  },
});

registerTool({
  name: "analytics_cost_forecast",
  description: "Get cost forecast based on recent usage",
  parameters: {
    type: "object",
    properties: { days: { type: "number", description: "Forecast period in days" } },
  },
  async execute(args: { days?: number }) {
    const forecast = await analyticsDashboard.getCostForecast(args?.days || 7);
    return JSON.stringify(forecast, null, 2);
  },
});

console.log("[analytics] Dashboard initialized with 4 tools");
