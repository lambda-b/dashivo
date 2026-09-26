import type { DashboardChange } from "@dashlet/shared/dashboard";
import type { DashboardBuildService } from "@dashlet/server/models/dashboard-build-service";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";

export interface DashboardServiceDependencies {
  buildService: DashboardBuildService;
  repository: DashboardRepository;
}

export const createDashboardService = ({
  buildService,
  repository,
}: DashboardServiceDependencies) => ({
  build: () => buildService.build(),
  listAssets: () => repository.listAssets(),
  read: () => repository.readDashboard(),
  readInput: (path: string) => repository.readInput(path),
  readPython: (path: string) => repository.readPython(path),
  update: (change: DashboardChange) => repository.updateDashboard(change),
  writePython: (path: string, source: string) => repository.writePython(path, source),
});

export type DashboardService = ReturnType<typeof createDashboardService>;
