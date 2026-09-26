import { z } from "zod";
import { dashboardSchema } from "./dashboard.ts";

export const assetsEndpoint = "/__dashlet/assets";
export const buildEndpoint = "/__dashlet/build";
export const dashboardEndpoint = "/__dashlet/dashboard";
export const inputSourceEndpoint = "/__dashlet/input-source";
export const pythonSourceEndpoint = "/__dashlet/python-source";

export const apiErrorSchema = z.object({ error: z.string() });
export const dashboardResponseSchema = z.object({ dashboard: dashboardSchema });
export const dashboardAssetCatalogSchema = z.object({
  csv: z.array(z.string()),
  python: z.array(z.string()),
});
export const assetSourceQuerySchema = z.object({ path: z.string().min(1) });
export const sourceResponseSchema = z.object({ source: z.string() });

export type DashboardAssetCatalog = z.infer<typeof dashboardAssetCatalogSchema>;
