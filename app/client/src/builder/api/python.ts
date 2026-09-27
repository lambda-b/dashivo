import {
  dashboardAssetsEndpoint,
  dashboardAssetCatalogSchema,
  dashboardInputSourceEndpoint,
  dashboardPythonLogicEndpoint,
  dashboardPythonSourceEndpoint,
  dashboardResponseSchema,
  sourceResponseSchema,
} from "@shared/api";
import type { PythonLogicCreate } from "@shared/dashboard";
import { request, requestJson } from "@/builder/api/request";

const pythonSourceUrl = (dashboardId: string, path: string) =>
  `${dashboardPythonSourceEndpoint(dashboardId)}?path=${encodeURIComponent(path)}`;

export const loadPythonSource = async (dashboardId: string, path: string) => {
  const result = await requestJson(
    pythonSourceUrl(dashboardId, path),
    undefined,
    "Pythonを読み込めませんでした。",
  );

  return sourceResponseSchema.parse(result).source;
};

export const loadInputSource = async (dashboardId: string, path: string) => {
  const result = await requestJson(
    `${dashboardInputSourceEndpoint(dashboardId)}?path=${encodeURIComponent(path)}`,
    undefined,
    "入力データを読み込めませんでした。",
  );

  return sourceResponseSchema.parse(result).source;
};

export const savePythonSource = async (dashboardId: string, path: string, source: string) => {
  await request(
    pythonSourceUrl(dashboardId, path),
    {
      method: "PUT",
      headers: { "Content-Type": "text/x-python; charset=utf-8" },
      body: source,
    },
    "Pythonを保存できませんでした。",
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
    "ロジックを作成できませんでした。",
  );

  return dashboardResponseSchema.parse(result).dashboard;
};

export const loadAssetCatalog = async (dashboardId: string) => {
  return dashboardAssetCatalogSchema.parse(
    await requestJson(
      dashboardAssetsEndpoint(dashboardId),
      undefined,
      "ファイル一覧を取得できませんでした。",
    ),
  );
};
