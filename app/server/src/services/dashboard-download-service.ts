import type { DashboardBuildService } from "@dashlet/server/models/dashboard-build-service";

export const createDashboardDownloadService = (buildService: DashboardBuildService) => ({
  build: () => buildService.build(),
});

export type DashboardDownloadService = ReturnType<typeof createDashboardDownloadService>;
