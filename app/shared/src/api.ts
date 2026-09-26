import { z } from "zod";
import {
  dashboardSchema,
  inputSourcePathSchema,
  pythonSourcePathSchema,
} from "@dashlet/shared/dashboard";

export const assetsEndpoint = "/api/assets";
export const dashboardsEndpoint = "/api/dashboards";
export const dashboardEndpoint = `${dashboardsEndpoint}/:id`;
export const dashboardItemEndpoint = (id: string) =>
  `${dashboardsEndpoint}/${encodeURIComponent(id)}`;
export const downloadEndpoint = `${dashboardEndpoint}/download`;
export const dashboardDownloadEndpoint = (id: string) => `${dashboardItemEndpoint(id)}/download`;
export const inputSourceEndpoint = "/api/sources/csv";
export const pythonSourceEndpoint = "/api/sources/python";
export const pythonLogicEndpoint = `${dashboardEndpoint}/python-logics`;
export const dashboardPythonLogicEndpoint = (id: string) =>
  `${dashboardItemEndpoint(id)}/python-logics`;

export const dashboardListItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  updatedAt: z.string(),
});
export const dashboardListSchema = z.array(dashboardListItemSchema);
export const dashboardCreateSchema = z.object({ title: z.string().trim().min(1).max(120) });

export const apiErrorSchema = z.object({ error: z.string() });
export const dashboardResponseSchema = z.object({ dashboard: dashboardSchema });
export const dashboardCreatedResponseSchema = z.object({
  dashboard: dashboardListItemSchema,
});
export const dashboardListResponseSchema = z.object({ dashboards: dashboardListSchema });
export const dashboardAssetCatalogSchema = z.object({
  csv: z.array(z.string()),
  python: z.array(z.string()),
});
export const inputSourceQuerySchema = z.object({ path: inputSourcePathSchema });
export const pythonSourceQuerySchema = z.object({ path: pythonSourcePathSchema });
export const sourceResponseSchema = z.object({ source: z.string() });

export type DashboardListItem = z.infer<typeof dashboardListItemSchema>;

export type DashboardAssetCatalog = z.infer<typeof dashboardAssetCatalogSchema>;
