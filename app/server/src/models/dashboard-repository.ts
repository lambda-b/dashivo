import type { DashboardAssetCatalog } from "@dashlet/shared/api";
import type { DashboardSchema, PythonLogicCreate } from "@dashlet/shared/dashboard";

export interface PythonLogicRegistration {
  dashboard: DashboardSchema;
  expectedVersion: string;
  logic: PythonLogicCreate;
}

export interface DashboardSnapshot {
  dashboard: unknown;
  version: string;
}

export interface DashboardRepository {
  listAssets(): Promise<DashboardAssetCatalog>;
  readDashboard(): Promise<DashboardSnapshot>;
  writeDashboard(dashboard: DashboardSchema, expectedVersion: string): Promise<void>;
  readInput(path: string): Promise<string>;
  readPython(path: string): Promise<string>;
  writePython(path: string, source: string): Promise<void>;
  createPython(path: string, source: string): Promise<void>;
  deletePython(path: string): Promise<void>;
  /** Commit the Python source and its Dashboard reference as one persistence operation. */
  registerPythonLogicAtomically(registration: PythonLogicRegistration): Promise<void>;
}
