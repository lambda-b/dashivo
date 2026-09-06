import type { DashboardSchema } from "@/schema/dashboard";

const dashboardEditorEndpoint = "/__dashlet/dashboard";

export const saveDashboardFile = async (dashboard: DashboardSchema): Promise<void> => {
  const response = await fetch(dashboardEditorEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dashboard),
  });

  if (response.ok) return;
  const result: unknown = await response.json();
  const message =
    typeof result === "object" && result !== null && "error" in result
      ? String(result.error)
      : "dashboard.jsonを保存できませんでした。";
  throw new Error(message);
};
