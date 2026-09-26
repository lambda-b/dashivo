import {
  dashboardCreateSchema,
  dashboardCreatedResponseSchema,
  dashboardListResponseSchema,
} from "@dashlet/shared/api";
import { dashboardDefinitionChangeSchema } from "@dashlet/shared/dashboard";
import type { Handler } from "hono";
import type { ServerEnv } from "@dashlet/server/context";
import { parseJsonBody } from "@dashlet/server/controllers/validate-request";

/** ユーザーが利用できるDashboard一覧を取得する。 */
export const listDashboards: Handler<ServerEnv> = async (context) =>
  context.json(
    dashboardListResponseSchema.parse({
      dashboards: await context.get("dashboardDefinitionService").list(),
    }),
  );

/** Dashboardを新規作成する。 */
export const createDashboard: Handler<ServerEnv> = async (context) => {
  const { title } = await parseJsonBody(context.req.raw, dashboardCreateSchema);
  const dashboard = await context.get("dashboardDefinitionService").create(title);

  return context.json(dashboardCreatedResponseSchema.parse({ dashboard }), 201);
};

/**
 * Dashboard UI定義を取得する。
 */
export const getDashboard: Handler<ServerEnv> = async (context) => {
  const dashboard = await context.get("dashboardDefinitionService").read(context.req.param("id")!);

  return context.json({ dashboard });
};

/**
 * Dashboard UI定義を更新する。
 */
export const updateDashboard: Handler<ServerEnv> = async (context) => {
  const change = await parseJsonBody(context.req.raw, dashboardDefinitionChangeSchema);
  const dashboard = await context
    .get("dashboardDefinitionService")
    .update(context.req.param("id")!, change);

  return context.json({ dashboard });
};
