import {
  assetsEndpoint,
  dashboardEndpoint,
  dashboardsEndpoint,
  downloadEndpoint,
  inputSourceEndpoint,
  pythonLogicEndpoint,
  pythonSourceEndpoint,
} from "@dashlet/shared-schema/api";
import type { Hono } from "hono";
import type { ServerEnv } from "@dashlet/server/context";
import { getDashboardAssets, getInputSource } from "@dashlet/server/controllers/dashboard-asset";
import { downloadDashboard } from "@dashlet/server/controllers/dashboard-download";
import {
  createDashboard,
  getDashboard,
  listDashboards,
  updateDashboard,
} from "@dashlet/server/controllers/dashboard";
import {
  createPythonLogic,
  getPythonSource,
  updatePythonSource,
} from "@dashlet/server/controllers/python-logic";

export const configureServerRoutes = (app: Hono<ServerEnv>) => {
  app.get(dashboardsEndpoint, listDashboards);
  app.post(dashboardsEndpoint, createDashboard);
  app.get(dashboardEndpoint, getDashboard);
  app.put(dashboardEndpoint, updateDashboard);
  app.get(assetsEndpoint, getDashboardAssets);
  app.get(inputSourceEndpoint, getInputSource);
  app.post(downloadEndpoint, downloadDashboard);
  app.post(pythonLogicEndpoint, createPythonLogic);
  app.get(pythonSourceEndpoint, getPythonSource);
  app.put(pythonSourceEndpoint, updatePythonSource);
};
