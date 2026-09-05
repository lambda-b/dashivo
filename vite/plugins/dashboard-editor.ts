import fs from "node:fs/promises";
import path from "node:path";
import { json } from "node:stream/consumers";
import type { Plugin } from "vite";
import { format } from "oxfmt";
import { dashboardSchema, type DashboardSchema } from "../../src/schema/dashboard.ts";

export const dashboardEditorEndpoint = "/__dashlet/dashboard";

export const writeDashboardFile = async (
  projectRoot: string,
  source: unknown,
): Promise<DashboardSchema> => {
  const dashboard = dashboardSchema.parse(source);
  const destination = path.join(projectRoot, "dashboard", "dashboard.json");
  const currentSource = await fs
    .readFile(destination, "utf8")
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
  if (currentSource) {
    const current = dashboardSchema.safeParse(JSON.parse(currentSource));
    if (current.success && JSON.stringify(current.data) === JSON.stringify(dashboard)) {
      return dashboard;
    }
  }
  const formatted = await format(destination, JSON.stringify(dashboard));
  await fs.writeFile(destination, formatted.code, "utf8");
  return dashboard;
};

export const dashboardEditor = (projectRoot: string): Plugin => ({
  name: "dashlet-dashboard-editor",
  apply: "serve",
  configureServer: (server) => {
    server.middlewares.use(dashboardEditorEndpoint, async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      if (request.method !== "POST") {
        response.statusCode = 405;
        response.setHeader("Allow", "POST");
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      try {
        const dashboard = await writeDashboardFile(projectRoot, await json(request));
        response.end(JSON.stringify({ dashboard }));
      } catch (error) {
        response.statusCode = 400;
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Dashboard could not be saved",
          }),
        );
      }
    });
  },
});
