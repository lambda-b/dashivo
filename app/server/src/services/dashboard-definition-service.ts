import {
  dashboardDefinitionChangeSchema,
  dashboardSchema,
  type DashboardDefinitionChange,
  type DashboardSchema,
} from "@dashlet/shared/dashboard";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";

export const createDashboardDefinitionService = (repository: DashboardRepository) => {
  const read = async () => {
    const snapshot = await repository.readDashboard();

    return dashboardSchema.parse(snapshot.dashboard);
  };

  const write = async (dashboard: DashboardSchema, expectedVersion: string) => {
    const validDashboard = dashboardSchema.parse(dashboard);

    await repository.writeDashboard(validDashboard, expectedVersion);

    return validDashboard;
  };

  const update = async (change: DashboardDefinitionChange) => {
    const validChange = dashboardDefinitionChangeSchema.parse(change);
    const snapshot = await repository.readDashboard();
    const current = dashboardSchema.parse(snapshot.dashboard);

    if ("settings" in validChange) {
      return write({ ...validChange.settings, analysis: current.analysis }, snapshot.version);
    }

    return write({ ...current, analysis: validChange.analysis }, snapshot.version);
  };

  return { read, update };
};

export type DashboardDefinitionService = ReturnType<typeof createDashboardDefinitionService>;
