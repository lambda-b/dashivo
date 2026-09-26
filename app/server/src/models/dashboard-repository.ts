import type { DashboardAssetCatalog } from "@dashlet/shared/api";
import type { DashboardChange, DashboardSchema } from "@dashlet/shared/dashboard";

export interface DashboardRepository {
  listAssets(): Promise<DashboardAssetCatalog>;
  readDashboard(): Promise<DashboardSchema>;
  readInput(path: string): Promise<string>;
  readPython(path: string): Promise<string>;
  updateDashboard(change: DashboardChange): Promise<DashboardSchema>;
  writePython(path: string, source: string): Promise<void>;
}
