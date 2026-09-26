import {
  apiErrorSchema,
  dashboardCreateSchema,
  dashboardCreatedResponseSchema,
  dashboardListResponseSchema,
  dashboardsEndpoint,
} from "@shared/api";

export const loadDashboards = async ({ signal }: { signal: AbortSignal }) => {
  const response = await fetch(dashboardsEndpoint, { signal });
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(apiErrorSchema.safeParse(result).data?.error ?? "一覧を読み込めませんでした。");
  }

  return dashboardListResponseSchema.parse(result).dashboards;
};

export const createDashboard = async (title: string) => {
  const response = await fetch(dashboardsEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dashboardCreateSchema.parse({ title })),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(apiErrorSchema.safeParse(result).data?.error ?? "作成できませんでした。");
  }

  return dashboardCreatedResponseSchema.parse(result).dashboard;
};
