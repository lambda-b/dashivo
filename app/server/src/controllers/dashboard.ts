import { dashboardDefinitionChangeSchema } from "@dashlet/shared/dashboard";
import type { Handler } from "hono";
import type { ServerEnv } from "@dashlet/server/context";
import { parseJsonBody } from "@dashlet/server/controllers/validate-request";

/**
 * Dashboard UI定義を取得する。
 */
export const getDashboard: Handler<ServerEnv> = async (context) => {
  const dashboard = await context.get("dashboardDefinitionService").read();

  return context.json({ dashboard });
};

/**
 * Dashboard UI定義を更新する。
 */
export const updateDashboard: Handler<ServerEnv> = async (context) => {
  const change = await parseJsonBody(context.req.raw, dashboardDefinitionChangeSchema);
  const dashboard = await context.get("dashboardDefinitionService").update(change);

  return context.json({ dashboard });
};
