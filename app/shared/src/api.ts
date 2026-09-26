import { z } from "zod";
import { dashboardSchema } from "@dashlet/shared/dashboard";

export const assetsEndpoint = "/api/assets";
export const dashboardEndpoint = "/api/dashboard";
export const downloadEndpoint = "/api/dashboard/download";
export const inputSourceEndpoint = "/api/sources/csv";
export const pythonSourceEndpoint = "/api/sources/python";

export const apiErrorSchema = z.object({ error: z.string() });
export const dashboardResponseSchema = z.object({ dashboard: dashboardSchema });
export const dashboardAssetCatalogSchema = z.object({
  csv: z.array(z.string()),
  python: z.array(z.string()),
});
export const assetSourceQuerySchema = z.object({ path: z.string().min(1) });
export const sourceResponseSchema = z.object({ source: z.string() });

export type DashboardAssetCatalog = z.infer<typeof dashboardAssetCatalogSchema>;
