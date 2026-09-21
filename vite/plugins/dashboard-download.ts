import type { Plugin } from "vite";
import { buildDashboard } from "../build/build-dashboard.ts";
import { withDashboardOperation } from "../server/dashboard-operation.ts";

export const dashboardDownloadEndpoint = "/__dashlet/build";

export const dashboardDownload = (projectRoot: string): Plugin => ({
  name: "dashlet-dashboard-download",
  apply: "serve",
  configureServer: (server) => {
    server.middlewares.use(dashboardDownloadEndpoint, async (request, response) => {
      if (request.method !== "POST") {
        response.statusCode = 405;
        response.setHeader("Allow", "POST");
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      try {
        const dashboard = await withDashboardOperation(() => buildDashboard(projectRoot));

        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.setHeader("Content-Disposition", 'attachment; filename="dashboard.html"');
        response.end(dashboard);
      } catch (error) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Dashboard could not be built",
          }),
        );
      }
    });
  },
});
