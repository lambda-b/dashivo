import type { DashboardAssetCatalog, DashboardListItem } from "@dashivo/shared-schema/api";
import type { DashboardSchema, PythonLogicCreate } from "@dashivo/shared-schema/dashboard";

export interface PythonLogicRegistration {
  dashboard: DashboardSchema;
  expectedVersion: string;
  logic: PythonLogicCreate;
}

export interface DashboardSnapshot {
  dashboard: unknown;
  version: string;
}

export interface DashboardDefinitionRepository {
  listDashboards(): Promise<DashboardListItem[]>;
  createDashboard(preferredId: string, dashboard: DashboardSchema): Promise<DashboardListItem>;
  readDashboard(id: string): Promise<DashboardSnapshot>;
  writeDashboard(id: string, dashboard: DashboardSchema, expectedVersion: string): Promise<void>;
  /** Publish definition and sources together; an existing ID is returned without overwriting it. */
  registerDashboardAtomically(
    id: string,
    dashboard: DashboardSchema,
    sources: Record<string, string>,
  ): Promise<DashboardListItem>;
}

export interface DashboardAssetRepository {
  listAssets(id: string): Promise<DashboardAssetCatalog>;
  readInput(id: string, path: string): Promise<string>;
  createInput(id: string, fileName: string, source: string): Promise<string>;
}

export interface PythonLogicRepository {
  readPython(id: string, path: string): Promise<string>;
  writePython(id: string, path: string, source: string): Promise<void>;
  createPython(id: string, path: string, source: string): Promise<void>;
  deletePython(id: string, path: string): Promise<void>;
  /** Commit the Python source and its Dashboard reference as one persistence operation. */
  registerPythonLogicAtomically(id: string, registration: PythonLogicRegistration): Promise<void>;
}

export interface DashboardRepository
  extends DashboardDefinitionRepository, DashboardAssetRepository, PythonLogicRepository {}
