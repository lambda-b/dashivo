import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { dashboardSchema, type DashboardSchema } from "@dashlet/shared/dashboard";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";
import { buildDashboard } from "@dashlet/server/services/build-dashboard";

export type DashboardHtmlBuilder = (
  sourceRoot: string,
  dashboardPath: string,
  assetCacheRoot: string,
) => Promise<ArrayBuffer>;

const writeSource = async (root: string, sourcePath: string, source: string) => {
  const destination = path.resolve(root, sourcePath);
  const relative = path.relative(root, destination);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `Dashboard source must stay within the temporary build directory: ${sourcePath}`,
    );
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, "utf8");
};

const loadSources = async (repository: DashboardRepository, dashboard: DashboardSchema) => {
  const [inputs, logic] = await Promise.all([
    Promise.all(
      dashboard.analysis.inputs.map(
        async ({ path: sourcePath }) =>
          [sourcePath, await repository.readInput(sourcePath)] as const,
      ),
    ),
    Promise.all(
      dashboard.analysis.logic.map(
        async ({ path: sourcePath }) =>
          [sourcePath, await repository.readPython(sourcePath)] as const,
      ),
    ),
  ]);

  return [...inputs, ...logic];
};

export const createDashboardDownloadService = (
  repository: DashboardRepository,
  projectRoot: string,
  htmlBuilder: DashboardHtmlBuilder = buildDashboard,
) => ({
  build: async (dashboardId: string) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dashboardId)) {
      throw new Error("Invalid dashboard id");
    }

    const snapshot = await repository.readDashboard(dashboardId);
    const dashboard = dashboardSchema.parse(snapshot.dashboard);
    const sources = await loadSources(repository, dashboard);
    const dashboardRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-dashboard-"));
    const dashboardPath = path.join(dashboardRoot, "dashboard.json");
    const cacheRoot = path.join(os.tmpdir(), "dashlet-pyodide-cache", dashboardId);

    try {
      await fs.writeFile(dashboardPath, JSON.stringify(dashboard), "utf8");
      await Promise.all(
        sources.map(([sourcePath, source]) => writeSource(dashboardRoot, sourcePath, source)),
      );
      return await htmlBuilder(projectRoot, dashboardPath, cacheRoot);
    } finally {
      await fs.rm(dashboardRoot, { recursive: true, force: true });
    }
  },
});

export type DashboardDownloadService = ReturnType<typeof createDashboardDownloadService>;
