import type { DashboardChange, DashboardSchema } from "../../src/schema/dashboard.ts";

export interface DashboardAssetCatalog {
  csv: string[];
  python: string[];
}

export interface DashboardRepository {
  listAssets(): Promise<DashboardAssetCatalog>;
  readDashboard(): Promise<DashboardSchema>;
  readPython(path: string): Promise<string>;
  updateDashboard(change: DashboardChange): Promise<DashboardSchema>;
  writePython(path: string, source: string): Promise<void>;
}
