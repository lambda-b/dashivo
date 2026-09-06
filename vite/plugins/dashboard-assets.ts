import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

export const dashboardAssetsEndpoint = "/__dashlet/assets";

const listDashboardFiles = async (dashboardRoot: string, pattern: string) => {
  const files: string[] = [];
  for await (const file of fs.glob(pattern, { cwd: dashboardRoot })) files.push(file);
  return files.toSorted();
};

export const dashboardAssets = (projectRoot: string): Plugin => ({
  name: "dashlet-dashboard-assets",
  apply: "serve",
  configureServer: (server) => {
    server.middlewares.use(dashboardAssetsEndpoint, async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      if (request.method !== "GET") {
        response.statusCode = 405;
        response.setHeader("Allow", "GET");
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      try {
        const dashboardRoot = path.join(projectRoot, "dashboard");
        const [csv, python] = await Promise.all([
          listDashboardFiles(dashboardRoot, "data/**/*.csv"),
          listDashboardFiles(dashboardRoot, "logic/**/*.py"),
        ]);
        response.end(JSON.stringify({ csv, python }));
      } catch (error) {
        response.statusCode = 500;
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Dashboard assets could not be listed",
          }),
        );
      }
    });
  },
});
