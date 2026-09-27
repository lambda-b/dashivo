import { pythonSourceQuerySchema } from "@dashlet/shared-schema/api";
import { pythonLogicCreateSchema } from "@dashlet/shared-schema/dashboard";
import type { Handler } from "hono";
import type { ServerEnv } from "@dashlet/server/context";
import { parseJsonBody, parseQuery } from "@dashlet/server/controllers/validate-request";

/**
 * Pythonロジックを新規作成し、Dashboard定義に登録する。
 */
export const createPythonLogic: Handler<ServerEnv> = async (context) => {
  const definition = await parseJsonBody(context.req.raw, pythonLogicCreateSchema);
  const dashboard = await context
    .get("pythonLogicService")
    .create(context.req.param("id")!, definition);

  return context.json({ dashboard });
};

/**
 * Pythonロジックのソースコードを取得する。
 */
export const getPythonSource: Handler<ServerEnv> = async (context) => {
  const query = parseQuery(context.req.query(), pythonSourceQuerySchema);
  const source = await context.get("pythonLogicService").read(context.req.param("id")!, query.path);

  return context.json({ source });
};

/**
 * Pythonロジックのソースコードを保存する。
 */
export const updatePythonSource: Handler<ServerEnv> = async (context) => {
  const query = parseQuery(context.req.query(), pythonSourceQuerySchema);

  await context
    .get("pythonLogicService")
    .write(context.req.param("id")!, query.path, await context.req.text());

  return context.json({ path: query.path });
};
