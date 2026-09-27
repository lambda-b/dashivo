import {
  dashboardCreateSchema,
  dashboardCreatedResponseSchema,
  dashboardListResponseSchema,
  dashboardsEndpoint,
} from "@shared/api";
import { requestJson } from "@/builder/api/request";

export const loadDashboards = async ({ signal }: { signal: AbortSignal }) => {
  const result = await requestJson(dashboardsEndpoint, { signal }, "一覧を読み込めませんでした。");

  return dashboardListResponseSchema.parse(result).dashboards;
};

export const createDashboard = async (title: string) => {
  const result = await requestJson(
    dashboardsEndpoint,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dashboardCreateSchema.parse({ title })),
    },
    "作成できませんでした。",
  );

  return dashboardCreatedResponseSchema.parse(result).dashboard;
};
