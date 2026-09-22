import { buildDashboard } from "../build/build-dashboard.ts";
import { withDashboardOperation } from "./dashboard-operation.ts";

export interface DashboardBuildService {
  build(): Promise<Uint8Array>;
}

export const createFilesystemDashboardBuildService = (
  projectRoot: string,
): DashboardBuildService => ({
  build: () => withDashboardOperation(() => buildDashboard(projectRoot)),
});
