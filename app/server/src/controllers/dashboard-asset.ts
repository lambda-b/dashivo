import { inputSourceQuerySchema, inputSourceUploadQuerySchema } from "@dashivo/shared-schema/api";
import type { Handler } from "hono";
import type { ServerEnv } from "@dashivo/server/context";
import { parseQuery } from "@dashivo/server/controllers/validate-request";

/**
 * Dashboardで利用できるCSV・Pythonファイルの一覧を取得する。
 */
export const getDashboardAssets: Handler<ServerEnv> = async (context) =>
  context.json(await context.get("assetService").list(context.req.param("id")!));

/**
 * CSV入力ソースを取得する。
 */
export const getInputSource: Handler<ServerEnv> = async (context) => {
  const query = parseQuery(context.req.query(), inputSourceQuerySchema);
  const source = await context.get("assetService").readInput(context.req.param("id")!, query.path);

  return context.json({ source });
};

/**
 * ダッシュボード専用のCSV入力ファイルを登録する。
 */
export const uploadInputSource: Handler<ServerEnv> = async (context) => {
  const query = parseQuery(context.req.query(), inputSourceUploadQuerySchema);
  const source = await context.req.text();
  const path = await context
    .get("assetService")
    .createInput(context.req.param("id")!, query.fileName, source);

  return context.json({ path }, 201);
};
