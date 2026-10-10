import { loadDashboard, saveDashboard } from "@/api/dashboard";
import { createDashboard, loadDashboards } from "@/api/dashboards";
import { downloadDashboardFile } from "@/api/download";
import {
  createPythonLogic,
  loadAssetCatalog,
  loadInputSource,
  loadPythonSource,
  savePythonSource,
  uploadInputSource,
} from "@/api/python";

export const serverStorage = {
  loadDashboard,
  saveDashboard,
  createDashboard,
  loadDashboards,
  downloadDashboardFile,
  createPythonLogic,
  loadAssetCatalog,
  loadInputSource,
  loadPythonSource,
  savePythonSource,
  uploadInputSource,
};

export type DashboardStorage = typeof serverStorage;
