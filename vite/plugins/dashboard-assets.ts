import { text } from "node:stream/consumers";
import type { Plugin } from "vite";
import type { DashboardRepository } from "../server/dashboard-repository.ts";

export const dashboardAssetsEndpoint = "/__dashlet/assets";
export const pythonSourceEndpoint = "/__dashlet/python-source";

export const dashboardAssets = (repository: DashboardRepository): Plugin => ({
  name: "dashlet-dashboard-assets",
  apply: "serve",
  configureServer: (server) => {
    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url ?? "/", "http://localhost");

      if (url.pathname !== pythonSourceEndpoint) {
        next();
        return;
      }

      response.setHeader("Content-Type", "application/json; charset=utf-8");
      const sourcePath = url.searchParams.get("path") ?? "";

      try {
        if (request.method === "GET") {
          response.end(JSON.stringify({ source: await repository.readPython(sourcePath) }));
          return;
        }

        if (request.method === "PUT") {
          await repository.writePython(sourcePath, await text(request));
          response.end(JSON.stringify({ path: sourcePath }));
          return;
        }

        response.statusCode = 405;
        response.setHeader("Allow", "GET, PUT");
        response.end(JSON.stringify({ error: "Method not allowed" }));
      } catch (error) {
        response.statusCode = 400;
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Python source could not be processed",
          }),
        );
      }
    });

    server.middlewares.use(dashboardAssetsEndpoint, async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");

      if (request.method !== "GET") {
        response.statusCode = 405;
        response.setHeader("Allow", "GET");
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      try {
        response.end(JSON.stringify(await repository.listAssets()));
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
