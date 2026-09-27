import {
  dashboardDefinitionChangeSchema,
  dashboardIdSchema,
  dashboardSchema,
  createEmptyDashboard,
  type DashboardDefinitionChange,
  type DashboardSchema,
} from "@dashlet/shared-schema/dashboard";
import type { DashboardDefinitionRepository } from "@dashlet/server/models/dashboard-repository";

export const createDashboardDefinitionService = (repository: DashboardDefinitionRepository) => {
  const list = () => repository.listDashboards();
  const create = (title: string) => {
    const preferredId =
      title
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "dashboard";

    return repository.createDashboard(preferredId, createEmptyDashboard(title));
  };
  const read = async (id: string) => {
    const snapshot = await repository.readDashboard(dashboardIdSchema.parse(id));

    return dashboardSchema.parse(snapshot.dashboard);
  };

  const write = async (id: string, dashboard: DashboardSchema, expectedVersion: string) => {
    const dashboardId = dashboardIdSchema.parse(id);
    const validDashboard = dashboardSchema.parse(dashboard);

    await repository.writeDashboard(dashboardId, validDashboard, expectedVersion);

    return validDashboard;
  };

  const update = async (id: string, change: DashboardDefinitionChange) => {
    const dashboardId = dashboardIdSchema.parse(id);
    const validChange = dashboardDefinitionChangeSchema.parse(change);
    const snapshot = await repository.readDashboard(dashboardId);
    const current = dashboardSchema.parse(snapshot.dashboard);

    if ("settings" in validChange) {
      return write(
        dashboardId,
        { ...validChange.settings, analysis: current.analysis },
        snapshot.version,
      );
    }

    return write(dashboardId, { ...current, analysis: validChange.analysis }, snapshot.version);
  };

  return { list, create, read, update };
};

export type DashboardDefinitionService = ReturnType<typeof createDashboardDefinitionService>;
