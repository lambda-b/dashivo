import { inputSourceQuerySchema } from "@dashlet/shared/api";
import type { Handler } from "hono";
import type { ServerEnv } from "@dashlet/server/context";
import { parseQuery } from "@dashlet/server/controllers/validate-request";

/**
 * Dashboardで利用できるCSV・Pythonファイルの一覧を取得する。
 */
export const getDashboardAssets: Handler<ServerEnv> = async (context) =>
  context.json(await context.get("assetService").list());

/**
 * CSV入力ソースを取得する。
 */
export const getInputSource: Handler<ServerEnv> = async (context) => {
  const query = parseQuery(context.req.query(), inputSourceQuerySchema);
  const source = await context.get("assetService").readInput(query.path);

  return context.json({ source });
};
