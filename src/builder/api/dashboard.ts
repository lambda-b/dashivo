import { dashboardSchema, type AnalysisDefinition, type DashboardSchema } from "@/schema/dashboard";
import { setDashboard } from "@/app/context/useDashboard";

export type DashboardSettings = Omit<DashboardSchema, "analysis">;

let queue: Promise<unknown> = Promise.resolve();

export const saveDashboard = (
  change:
    | { settings: DashboardSettings }
    | { analysis: AnalysisDefinition }
    | { logic: { id: string; path: string; source: string } },
) => {
  const task = queue.then(async () => {
    const response = await fetch("/__dashlet/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "設定を保存できませんでした。");

    const dashboard = dashboardSchema.parse(result.dashboard);
    setDashboard(dashboard);
    return dashboard;
  });

  queue = task.catch(() => {});
  return task;
};

export const loadDashboard = async () => {
  const response = await fetch("/__dashlet/dashboard");
  if (!response.ok) throw new Error("設定を読み込めませんでした。");

  const { dashboard } = await response.json();
  setDashboard(dashboard);
};
