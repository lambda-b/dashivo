import fs from "node:fs/promises";
import path from "node:path";
import type { DashboardBuildService } from "@dashlet/server/models/dashboard-build-service";
import { buildDashboard } from "@dashlet/infra/export/build-dashboard";
import { DashboardNotFound } from "@dashlet/server/models/dashboard-not-found";

export const createFilesystemDashboardBuildService = (
  projectRoot: string,
): DashboardBuildService => ({
  build: async (dashboardId) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dashboardId)) throw new Error("Invalid dashboard id");
    const dashboardPath = path.join(projectRoot, "dashboard", "definitions", `${dashboardId}.json`);
    const definitionPath = await fs
      .access(dashboardPath)
      .then(() => dashboardPath)
      .catch(async () => {
        if (dashboardId !== "sales-overview") throw new DashboardNotFound(dashboardId);
        const legacyPath = path.join(projectRoot, "dashboard", "dashboard.json");
        await fs.access(legacyPath);
        return legacyPath;
      });

    return Uint8Array.from(
      await buildDashboard(
        projectRoot,
        definitionPath,
        path.join(projectRoot, ".pyodide-cache", dashboardId),
      ),
    ).buffer;
  },
});
