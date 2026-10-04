import type { DashboardSchema } from "@dashivo/shared-schema/dashboard";

export interface DashboardExportSource {
  path: string;
  source: string;
}

export interface DashboardExportRequest {
  dashboardId: string;
  dashboard: DashboardSchema;
  sources: readonly DashboardExportSource[];
}

export type DashboardHtmlBuilder = (request: DashboardExportRequest) => Promise<ArrayBuffer>;
