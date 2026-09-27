import { dashboardItemEndpoint, dashboardResponseSchema } from "@shared/api";
import type { DashboardDefinitionChange } from "@shared/dashboard";
import { requestJson } from "@/builder/api/request";

export const saveDashboard = async (id: string, change: DashboardDefinitionChange) => {
  const result = await requestJson(
    dashboardItemEndpoint(id),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    },
    "設定を保存できませんでした。",
  );

  return dashboardResponseSchema.parse(result).dashboard;
};

export const loadDashboard = async (id: string, { signal }: { signal: AbortSignal }) => {
  const result = await requestJson(
    dashboardItemEndpoint(id),
    { signal },
    "設定を読み込めませんでした。",
  );
  return dashboardResponseSchema.parse(result).dashboard;
};
