import { apiErrorSchema, dashboardEndpoint, dashboardResponseSchema } from "@shared/api";
import type { DashboardChange } from "@shared/dashboard";

export const saveDashboard = async (change: DashboardChange) => {
  const response = await fetch(dashboardEndpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(apiErrorSchema.safeParse(result).data?.error ?? "設定を保存できませんでした。");
  }

  return dashboardResponseSchema.parse(result).dashboard;
};

export const loadDashboard = async ({ signal }: { signal: AbortSignal }) => {
  const response = await fetch(dashboardEndpoint, { signal });
  if (!response.ok) throw new Error("設定を読み込めませんでした。");

  return dashboardResponseSchema.parse(await response.json()).dashboard;
};
