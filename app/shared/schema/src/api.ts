import { z } from "zod";
import {
  dashboardSchema,
  dashboardIdSchema,
  inputSourcePathSchema,
  pythonSourcePathSchema,
} from "@dashivo/shared-schema/dashboard";

export const dashboardsEndpoint = "/api/dashboards";
export const dashboardRegistrationEndpoint = `${dashboardsEndpoint}/registrations`;
export const dashboardEndpoint = `${dashboardsEndpoint}/:id`;
export const dashboardItemEndpoint = (id: string) =>
  `${dashboardsEndpoint}/${encodeURIComponent(id)}`;
export const downloadEndpoint = `${dashboardEndpoint}/download`;
export const dashboardDownloadEndpoint = (id: string) => `${dashboardItemEndpoint(id)}/download`;
export const assetsEndpoint = `${dashboardEndpoint}/assets`;
export const dashboardAssetsEndpoint = (id: string) => `${dashboardItemEndpoint(id)}/assets`;
export const inputSourceEndpoint = `${dashboardEndpoint}/sources/csv`;
export const dashboardInputSourceEndpoint = (id: string) =>
  `${dashboardItemEndpoint(id)}/sources/csv`;
export const pythonSourceEndpoint = `${dashboardEndpoint}/sources/python`;
export const dashboardPythonSourceEndpoint = (id: string) =>
  `${dashboardItemEndpoint(id)}/sources/python`;
export const pythonLogicEndpoint = `${dashboardEndpoint}/python-logics`;
export const dashboardPythonLogicEndpoint = (id: string) =>
  `${dashboardItemEndpoint(id)}/python-logics`;

export const dashboardListItemSchema = z.object({
  id: dashboardIdSchema,
  title: z.string().min(1),
  updatedAt: z.string(),
  sample: z.boolean().optional(),
});
export const dashboardListSchema = z.array(dashboardListItemSchema);
export type DashboardCreate = z.infer<typeof dashboardCreateSchema>;

export const dashboardCreateSchema = z.object({
  id: dashboardIdSchema,
});

export const dashboardRegistrationSchema = z
  .object({
    revisionId: z.uuid(),
    dashboard: dashboardSchema,
    sources: z.record(z.string(), z.string()),
  })
  .superRefine(({ dashboard, sources }, context) => {
    const paths = new Set(
      [...dashboard.analysis.inputs, ...dashboard.analysis.logic].map((item) => item.path),
    );
    if (
      Object.keys(sources).length !== paths.size ||
      [...paths].some((path) => !Object.hasOwn(sources, path))
    ) {
      context.addIssue({
        code: "custom",
        message: "Sources must contain exactly the files referenced by the dashboard",
      });
    }
  });

export type DashboardRegistration = z.infer<typeof dashboardRegistrationSchema>;

export const apiErrorSchema = z.object({ error: z.string() });
export const dashboardDownloadResponseSchema = z.object({
  url: z.union([
    z.url({ protocol: /^https$/ }),
    z.string().regex(/^\/api\/downloads\/[0-9a-f-]{36}\/[a-z0-9]+(?:-[a-z0-9]+)*$/),
  ]),
});
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
export const inputSourceUploadQuerySchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[^/\\\\]+\.csv$/i, "File name must be a .csv file name"),
});
export const pythonSourceQuerySchema = z.object({ path: pythonSourcePathSchema });
export const sourceResponseSchema = z.object({ source: z.string() });
export const inputSourceUploadResponseSchema = z.object({ path: inputSourcePathSchema });

export type DashboardListItem = z.infer<typeof dashboardListItemSchema>;

export type DashboardAssetCatalog = z.infer<typeof dashboardAssetCatalogSchema>;
