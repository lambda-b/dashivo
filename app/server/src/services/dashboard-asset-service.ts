import { inputSourcePathSchema } from "@dashlet/shared/dashboard";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";

export const createDashboardAssetService = (repository: DashboardRepository) => ({
  list: () => repository.listAssets(),
  readInput: (path: string) => repository.readInput(inputSourcePathSchema.parse(path)),
});

export type DashboardAssetService = ReturnType<typeof createDashboardAssetService>;
