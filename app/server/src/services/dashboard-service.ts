import type { DashboardChange } from "@dashlet/shared/dashboard";
import type { DashboardBuildService } from "../models/dashboard-build-service.ts";
import type { DashboardRepository } from "../models/dashboard-repository.ts";

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
