import {
  dashboardCreateSchema,
  dashboardCreatedResponseSchema,
  dashboardListResponseSchema,
  dashboardsEndpoint,
  dashboardRegistrationEndpoint,
  dashboardRegistrationSchema,
  type DashboardRegistration,
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

export const registerDashboard = async (registration: DashboardRegistration) => {
  const result = await requestJson(
    dashboardRegistrationEndpoint,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dashboardRegistrationSchema.parse(registration)),
    },
    messages.dashboard.registerFailed,
  );
  return dashboardCreatedResponseSchema.parse(result).dashboard;
};
