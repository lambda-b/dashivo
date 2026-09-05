import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";

export const parseDashboardJson = (source: string): DashboardSchema =>
  dashboardSchema.parse(JSON.parse(source));

export const serializeDashboard = (dashboard: DashboardSchema) =>
  `${JSON.stringify(dashboard, null, 2)}\n`;
