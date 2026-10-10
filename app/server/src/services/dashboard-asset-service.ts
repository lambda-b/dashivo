import { dashboardIdSchema, inputSourcePathSchema } from "@dashivo/shared-schema/dashboard";
import { inputSourceUploadQuerySchema } from "@dashivo/shared-schema/api";
import type { DashboardAssetRepository } from "@dashivo/server/models/dashboard-repository";
export const createDashboardAssetService = (repository: DashboardAssetRepository) => ({
  list: (dashboardId: string) => repository.listAssets(dashboardIdSchema.parse(dashboardId)),
  readInput: (dashboardId: string, path: string) => {
    return repository.readInput(
      dashboardIdSchema.parse(dashboardId),
      inputSourcePathSchema.parse(path),
    );
  },
  createInput: (dashboardId: string, fileName: string, source: string) =>
    repository.createInput(
      dashboardIdSchema.parse(dashboardId),
      inputSourceUploadQuerySchema.parse({ fileName }).fileName,
      source,
    ),
});

export type DashboardAssetService = ReturnType<typeof createDashboardAssetService>;
