import { dashboardSchema, type DashboardChange } from "@/schema/dashboard";

export const saveDashboard = async (change: DashboardChange) => {
  const response = await fetch("/__dashlet/dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "設定を保存できませんでした。");

  return dashboardSchema.parse(result.dashboard);
};

export const loadDashboard = async ({ signal }: { signal: AbortSignal }) => {
  const response = await fetch("/__dashlet/dashboard", { signal });
  if (!response.ok) throw new Error("設定を読み込めませんでした。");

  const { dashboard } = await response.json();
  return dashboardSchema.parse(dashboard);
};
