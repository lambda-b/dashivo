import fs from "node:fs/promises";
import path from "node:path";
import { text } from "node:stream/consumers";
import type { Plugin } from "vite";

export const dashboardAssetsEndpoint = "/__dashlet/assets";
export const pythonSourceEndpoint = "/__dashlet/python-source";

const listDashboardFiles = async (dashboardRoot: string, pattern: string) => {
  const files: string[] = [];
  for await (const file of fs.glob(pattern, { cwd: dashboardRoot })) files.push(file);
  return files.toSorted();
};

const resolvePythonPath = (projectRoot: string, sourcePath: string) => {
  const logicRoot = path.join(projectRoot, "dashboard", "logic");
  const destination = path.resolve(projectRoot, "dashboard", sourcePath);
  const relativePath = path.relative(logicRoot, destination);
  if (
    !sourcePath.startsWith("logic/") ||
    path.extname(destination) !== ".py" ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Python source must be a .py file under dashboard/logic");
  }
  return destination;
};

export const readPythonSource = (projectRoot: string, sourcePath: string) =>
  fs.readFile(resolvePythonPath(projectRoot, sourcePath), "utf8");

export const writePythonSource = async (
  projectRoot: string,
  sourcePath: string,
  source: string,
) => {
  const destination = resolvePythonPath(projectRoot, sourcePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, "utf8");
};

export const dashboardAssets = (projectRoot: string): Plugin => ({
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
          response.end(JSON.stringify({ source: await readPythonSource(projectRoot, sourcePath) }));
          return;
        }
        if (request.method === "PUT") {
          await writePythonSource(projectRoot, sourcePath, await text(request));
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
