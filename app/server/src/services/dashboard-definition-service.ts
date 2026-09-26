import {
  dashboardDefinitionChangeSchema,
  dashboardSchema,
  type DashboardDefinitionChange,
  type DashboardSchema,
} from "@dashlet/shared/dashboard";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";

export const createDashboardDefinitionService = (repository: DashboardRepository) => {
  const list = () => repository.listDashboards();
  const create = (title: string) => repository.createDashboard(title);
  const read = async (id: string) => {
    const snapshot = await repository.readDashboard(id);

    return dashboardSchema.parse(snapshot.dashboard);
  };

  const write = async (id: string, dashboard: DashboardSchema, expectedVersion: string) => {
    const validDashboard = dashboardSchema.parse(dashboard);

    await repository.writeDashboard(id, validDashboard, expectedVersion);

    return validDashboard;
  };

  const update = async (id: string, change: DashboardDefinitionChange) => {
    const validChange = dashboardDefinitionChangeSchema.parse(change);
    const snapshot = await repository.readDashboard(id);
    const current = dashboardSchema.parse(snapshot.dashboard);

    if ("settings" in validChange) {
      return write(id, { ...validChange.settings, analysis: current.analysis }, snapshot.version);
    }

    return write(id, { ...current, analysis: validChange.analysis }, snapshot.version);
  };

  return { list, create, read, update };
};

export type DashboardDefinitionService = ReturnType<typeof createDashboardDefinitionService>;
