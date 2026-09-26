import {
  apiErrorSchema,
  assetsEndpoint,
  dashboardAssetCatalogSchema,
  inputSourceEndpoint,
  dashboardPythonLogicEndpoint,
  pythonSourceEndpoint,
  dashboardResponseSchema,
  sourceResponseSchema,
} from "@shared/api";
import type { PythonLogicCreate } from "@shared/dashboard";

const pythonSourceUrl = (dashboardId: string, path: string) =>
  `${pythonSourceEndpoint}?dashboardId=${encodeURIComponent(dashboardId)}&path=${encodeURIComponent(path)}`;

export const loadPythonSource = async (dashboardId: string, path: string) => {
  const response = await fetch(pythonSourceUrl(dashboardId, path));
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      apiErrorSchema.safeParse(result).data?.error ?? "Pythonを読み込めませんでした。",
    );
  }

  return sourceResponseSchema.parse(result).source;
};

export const loadInputSource = async (path: string) => {
  const response = await fetch(`${inputSourceEndpoint}?path=${encodeURIComponent(path)}`);
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      apiErrorSchema.safeParse(result).data?.error ?? "入力データを読み込めませんでした。",
    );
  }

  return sourceResponseSchema.parse(result).source;
};

export const savePythonSource = async (dashboardId: string, path: string, source: string) => {
  const response = await fetch(pythonSourceUrl(dashboardId, path), {
    method: "PUT",
    headers: { "Content-Type": "text/x-python; charset=utf-8" },
    body: source,
  });
  if (!response.ok) {
    const result: unknown = await response.json();
    throw new Error(
      apiErrorSchema.safeParse(result).data?.error ?? "Pythonを保存できませんでした。",
    );
  }
};

export const createPythonLogic = async (dashboardId: string, definition: PythonLogicCreate) => {
  const response = await fetch(dashboardPythonLogicEndpoint(dashboardId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(definition),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      apiErrorSchema.safeParse(result).data?.error ?? "ロジックを作成できませんでした。",
    );
  }

  return dashboardResponseSchema.parse(result).dashboard;
};

export const loadAssetCatalog = async () => {
  const response = await fetch(assetsEndpoint);
  if (!response.ok) throw new Error("ファイル一覧を取得できませんでした。");

  return dashboardAssetCatalogSchema.parse(await response.json());
};
