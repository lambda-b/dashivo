import { dashboardIdSchema, inputSourcePathSchema } from "@dashlet/shared-schema/dashboard";
import type { DashboardAssetRepository } from "@dashlet/server/models/dashboard-repository";

export const createDashboardAssetService = (repository: DashboardAssetRepository) => ({
  list: (dashboardId: string) => repository.listAssets(dashboardIdSchema.parse(dashboardId)),
  readInput: (dashboardId: string, path: string) =>
    repository.readInput(dashboardIdSchema.parse(dashboardId), inputSourcePathSchema.parse(path)),
});

export type DashboardAssetService = ReturnType<typeof createDashboardAssetService>;
