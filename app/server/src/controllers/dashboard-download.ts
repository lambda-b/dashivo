import type { Handler } from "hono";
import type { ServerEnv } from "@dashivo/server/context";

/**
 * 保存済みDashboardから単一HTMLを生成・保存し、期限付きダウンロードURLを返す。
 */
export const downloadDashboard: Handler<ServerEnv> = async (context) => {
  return context.json(
    await context.get("dashboardDownloadService").build(context.req.param("id")!),
  );
};
