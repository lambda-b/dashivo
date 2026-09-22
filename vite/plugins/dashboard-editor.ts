import { json } from "node:stream/consumers";
import type { Plugin } from "vite";
import { dashboardChangeSchema } from "../../src/schema/dashboard.ts";
import type { DashboardRepository } from "../server/dashboard-repository.ts";

export const dashboardEditorEndpoint = "/__dashlet/dashboard";

export const dashboardEditor = (repository: DashboardRepository): Plugin => ({
  name: "dashlet-dashboard-editor",
  apply: "serve",
  handleHotUpdate: ({ file }) => (file.includes("/dashboard/") ? [] : undefined),
  configureServer: (server) => {
    server.middlewares.use(dashboardEditorEndpoint, async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");

      if (request.method !== "POST" && request.method !== "GET") {
        response.statusCode = 405;
        response.setHeader("Allow", "GET, POST");
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      try {
        const dashboard =
          request.method === "GET"
            ? await repository.readDashboard()
            : await repository.updateDashboard(dashboardChangeSchema.parse(await json(request)));

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
