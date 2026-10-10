import {
  assetsEndpoint,
  dashboardEndpoint,
  dashboardsEndpoint,
  dashboardRegistrationEndpoint,
  downloadEndpoint,
  inputSourceEndpoint,
  pythonLogicEndpoint,
  pythonSourceEndpoint,
} from "@dashivo/shared-schema/api";
import type { Hono } from "hono";
import type { ServerEnv } from "@dashivo/server/context";
import {
  getDashboardAssets,
  getInputSource,
  uploadInputSource,
} from "@dashivo/server/controllers/dashboard-asset";
import { downloadDashboard } from "@dashivo/server/controllers/dashboard-download";
import {
  createDashboard,
  registerDashboard,
  getDashboard,
  listDashboards,
  updateDashboard,
} from "@dashivo/server/controllers/dashboard";
import {
  createPythonLogic,
  getPythonSource,
  updatePythonSource,
} from "@dashivo/server/controllers/python-logic";

export const configureServerRoutes = (app: Hono<ServerEnv>) => {
  app.get(dashboardsEndpoint, listDashboards);
  app.post(dashboardsEndpoint, createDashboard);
  app.post(dashboardRegistrationEndpoint, registerDashboard);
  app.get(dashboardEndpoint, getDashboard);
  app.put(dashboardEndpoint, updateDashboard);
  app.get(assetsEndpoint, getDashboardAssets);
  app.get(inputSourceEndpoint, getInputSource);
  app.post(inputSourceEndpoint, uploadInputSource);
  app.post(downloadEndpoint, downloadDashboard);
  app.post(pythonLogicEndpoint, createPythonLogic);
  app.get(pythonSourceEndpoint, getPythonSource);
  app.put(pythonSourceEndpoint, updatePythonSource);
};
