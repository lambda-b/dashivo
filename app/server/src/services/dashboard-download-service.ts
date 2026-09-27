import {
  dashboardIdSchema,
  dashboardSchema,
  type DashboardSchema,
} from "@dashlet/shared-schema/dashboard";
import type {
  DashboardAssetRepository,
  DashboardDefinitionRepository,
  PythonLogicRepository,
} from "@dashlet/server/models/dashboard-repository";
import type { DashboardHtmlBuilder } from "@dashlet/server/models/dashboard-html-builder";

const loadSources = async (
  repository: DashboardDefinitionRepository & DashboardAssetRepository & PythonLogicRepository,
  dashboardId: string,
  dashboard: DashboardSchema,
) => {
  const [inputs, logic] = await Promise.all([
    Promise.all(
      dashboard.analysis.inputs.map(async ({ path: sourcePath }) => ({
        path: sourcePath,
        source: await repository.readInput(dashboardId, sourcePath),
      })),
    ),
    Promise.all(
      dashboard.analysis.logic.map(async ({ path: sourcePath }) => ({
        path: sourcePath,
        source: await repository.readPython(dashboardId, sourcePath),
      })),
    ),
  ]);

  return [...inputs, ...logic];
};

export const createDashboardDownloadService = (
  repository: DashboardDefinitionRepository & DashboardAssetRepository & PythonLogicRepository,
  htmlBuilder: DashboardHtmlBuilder,
) => ({
  build: async (dashboardId: string) => {
    const id = dashboardIdSchema.parse(dashboardId);

    const snapshot = await repository.readDashboard(id);
    const dashboard = dashboardSchema.parse(snapshot.dashboard);
    const sources = await loadSources(repository, id, dashboard);
    return htmlBuilder({ dashboardId: id, dashboard, sources });
  },
});

export type DashboardDownloadService = ReturnType<typeof createDashboardDownloadService>;
