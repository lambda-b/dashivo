import type { DashboardBuildService } from "@dashlet/server/models/dashboard-build-service";

export const createDashboardDownloadService = (buildService: DashboardBuildService) => ({
  build: (dashboardId: string) => buildService.build(dashboardId),
});

export type DashboardDownloadService = ReturnType<typeof createDashboardDownloadService>;
