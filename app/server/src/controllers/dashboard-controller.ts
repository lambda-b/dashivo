import { zValidator } from "@hono/zod-validator";
import {
  assetSourceQuerySchema,
  assetsEndpoint,
  dashboardEndpoint,
  downloadEndpoint,
  inputSourceEndpoint,
  pythonSourceEndpoint,
} from "@dashlet/shared/api";
import { dashboardChangeSchema } from "@dashlet/shared/dashboard";
import { HTTPException } from "hono/http-exception";
import type { Hono } from "hono";
import type { DashboardService } from "@dashlet/server/services/dashboard-service";

const validateQuery = zValidator("query", assetSourceQuerySchema, (result) => {
  if (!result.success) throw new HTTPException(400, { message: result.error.message });
});

export const registerDashboardRoutes = (app: Hono, service: DashboardService) => {
  app.get(dashboardEndpoint, async (context) => context.json({ dashboard: await service.read() }));
  app.put(
    dashboardEndpoint,
    zValidator("json", dashboardChangeSchema, (result) => {
      if (!result.success) throw new HTTPException(400, { message: result.error.message });
    }),
    async (context) => {
      const dashboard = await service.update(context.req.valid("json"));

      return context.json({ dashboard });
    },
  );
  app.get(pythonSourceEndpoint, validateQuery, async (context) => {
    const source = await service.readPython(context.req.valid("query").path);

    return context.json({ source });
  });
  app.put(pythonSourceEndpoint, validateQuery, async (context) => {
    const path = context.req.valid("query").path;

    await service.writePython(path, await context.req.text());

    return context.json({ path });
  });
  app.get(inputSourceEndpoint, validateQuery, async (context) => {
    const source = await service.readInput(context.req.valid("query").path);

    return context.json({ source });
  });
  app.get(assetsEndpoint, async (context) => context.json(await service.listAssets()));
  app.post(downloadEndpoint, async (context) =>
    context.body(await service.build(), 200, {
      "Content-Disposition": 'attachment; filename="dashboard.html"',
      "Content-Type": "text/html; charset=utf-8",
    }),
  );
};
