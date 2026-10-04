import {
  dashboardCreateSchema,
  dashboardCreatedResponseSchema,
  dashboardListResponseSchema,
  dashboardsEndpoint,
} from "@shared/api";
import { requestJson } from "@/api/request";
import { messages } from "@/messages";

export const loadDashboards = async ({ signal }: { signal: AbortSignal }) => {
  const result = await requestJson(
    dashboardsEndpoint,
    { signal },
    messages.dashboard.listLoadFailed,
  );

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
    messages.dashboard.createFailed,
  );

  return dashboardCreatedResponseSchema.parse(result).dashboard;
};
