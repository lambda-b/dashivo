import type { Handler } from "hono";
import type { ServerEnv } from "@dashlet/server/context";

/**
 * 保存済みDashboard定義から単一HTMLを生成してダウンロードする。
 */
export const downloadDashboard: Handler<ServerEnv> = async (context) =>
  context.body(await context.get("dashboardDownloadService").build(), 200, {
    "Content-Disposition": 'attachment; filename="dashboard.html"',
    "Content-Type": "text/html; charset=utf-8",
  });
