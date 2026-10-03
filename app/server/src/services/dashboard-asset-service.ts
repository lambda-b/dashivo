import { dashboardIdSchema, inputSourcePathSchema } from "@dashlet/shared-schema/dashboard";
import { inputSourceUploadQuerySchema } from "@dashlet/shared-schema/api";
import type { DashboardAssetRepository } from "@dashlet/server/models/dashboard-repository";
import { InputSourceAccessDenied } from "@dashlet/server/models/input-source-access-denied";

const ownedInputPath = (dashboardId: string, path: string) => {
  const id = dashboardIdSchema.parse(dashboardId);
  const sourcePath = inputSourcePathSchema.parse(path);

  if (!sourcePath.startsWith(`data/${id}/`)) throw new InputSourceAccessDenied();

  return { id, sourcePath };
};

export const createDashboardAssetService = (repository: DashboardAssetRepository) => ({
  list: (dashboardId: string) => repository.listAssets(dashboardIdSchema.parse(dashboardId)),
  readInput: (dashboardId: string, path: string) => {
    const input = ownedInputPath(dashboardId, path);
    return repository.readInput(input.id, input.sourcePath);
  },
  createInput: (dashboardId: string, fileName: string, source: string) =>
    repository.createInput(
      dashboardIdSchema.parse(dashboardId),
      inputSourceUploadQuerySchema.parse({ fileName }).fileName,
      source,
    ),
});

export type DashboardAssetService = ReturnType<typeof createDashboardAssetService>;
