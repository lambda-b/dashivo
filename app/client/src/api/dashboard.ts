import { dashboardItemEndpoint, dashboardResponseSchema } from "@shared/api";
import type { DashboardDefinitionChange } from "@shared/dashboard";
import { requestJson } from "@/api/request";
import { messages } from "@/messages";

export const saveDashboard = async (id: string, change: DashboardDefinitionChange) => {
  const result = await requestJson(
    dashboardItemEndpoint(id),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    },
    messages.dashboard.saveFailed,
  );

  return dashboardResponseSchema.parse(result).dashboard;
};

export const loadDashboard = async (id: string, { signal }: { signal: AbortSignal }) => {
  const result = await requestJson(
    dashboardItemEndpoint(id),
    { signal },
    messages.dashboard.loadFailed,
  );
  return dashboardResponseSchema.parse(result).dashboard;
};
