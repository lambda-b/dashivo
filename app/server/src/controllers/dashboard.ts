import {
  dashboardCreateSchema,
  dashboardCreatedResponseSchema,
  dashboardListResponseSchema,
  dashboardRegistrationSchema,
} from "@dashivo/shared-schema/api";
import { dashboardDefinitionChangeSchema } from "@dashivo/shared-schema/dashboard";
import type { Handler } from "hono";
import type { ServerEnv } from "@dashivo/server/context";
import { parseJsonBody } from "@dashivo/server/controllers/validate-request";

/** ユーザーが利用できるDashboard一覧を取得する。 */
export const listDashboards: Handler<ServerEnv> = async (context) =>
  context.json(
    dashboardListResponseSchema.parse({
      dashboards: await context.get("dashboardDefinitionService").list(),
    }),
  );

/** Dashboardを新規作成する。 */
export const createDashboard: Handler<ServerEnv> = async (context) => {
  const definition = await parseJsonBody(context.req.raw, dashboardCreateSchema);
  const dashboard = await context.get("dashboardDefinitionService").create(definition);

  return context.json(dashboardCreatedResponseSchema.parse({ dashboard }), 201);
};

/** 未認証で編集した版を、ソースを含めて重複なく登録する。 */
export const registerDashboard: Handler<ServerEnv> = async (context) => {
  const registration = await parseJsonBody(context.req.raw, dashboardRegistrationSchema);
  const dashboard = await context.get("dashboardDefinitionService").register(registration);
  return context.json(dashboardCreatedResponseSchema.parse({ dashboard }));
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
