import {
  dashboardAssetsEndpoint,
  dashboardAssetCatalogSchema,
  dashboardInputSourceEndpoint,
  dashboardPythonLogicEndpoint,
  dashboardPythonSourceEndpoint,
  inputSourceUploadResponseSchema,
  dashboardResponseSchema,
  sourceResponseSchema,
} from "@shared/api";
import type { PythonLogicCreate } from "@shared/dashboard";
import { request, requestJson } from "@/api/request";
import { messages } from "@/messages";

const pythonSourceUrl = (dashboardId: string, path: string) =>
  `${dashboardPythonSourceEndpoint(dashboardId)}?path=${encodeURIComponent(path)}`;

export const loadPythonSource = async (dashboardId: string, path: string) => {
  const result = await requestJson(
    pythonSourceUrl(dashboardId, path),
    undefined,
    messages.logic.loadFailed,
  );

  return sourceResponseSchema.parse(result).source;
};

export const loadInputSource = async (dashboardId: string, path: string) => {
  const result = await requestJson(
    `${dashboardInputSourceEndpoint(dashboardId)}?path=${encodeURIComponent(path)}`,
    undefined,
    messages.csv.loadFailed,
  );

  return sourceResponseSchema.parse(result).source;
};

export const uploadInputSource = async (dashboardId: string, file: File) => {
  const result = await requestJson(
    `${dashboardInputSourceEndpoint(dashboardId)}?fileName=${encodeURIComponent(file.name)}`,
    {
      method: "POST",
      headers: { "Content-Type": "text/csv; charset=utf-8" },
      body: file,
    },
    messages.csv.registerFailed,
  );

  return inputSourceUploadResponseSchema.parse(result).path;
};

export const savePythonSource = async (dashboardId: string, path: string, source: string) => {
  await request(
    pythonSourceUrl(dashboardId, path),
    {
      method: "PUT",
      headers: { "Content-Type": "text/x-python; charset=utf-8" },
      body: source,
    },
    messages.logic.saveFailed,
  );
};

export const createPythonLogic = async (dashboardId: string, definition: PythonLogicCreate) => {
  const result = await requestJson(
    dashboardPythonLogicEndpoint(dashboardId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(definition),
    },
    messages.logic.createFailed,
  );

  return dashboardResponseSchema.parse(result).dashboard;
};

export const loadAssetCatalog = async (dashboardId: string) => {
  return dashboardAssetCatalogSchema.parse(
    await requestJson(dashboardAssetsEndpoint(dashboardId), undefined, messages.assets.loadFailed),
  );
};
