import { zValidator } from "@hono/zod-validator";
import {
  assetSourceQuerySchema,
  assetsEndpoint,
  buildEndpoint,
  dashboardEndpoint,
  inputSourceEndpoint,
  pythonSourceEndpoint,
} from "@dashlet/shared/api";
import { dashboardChangeSchema } from "@dashlet/shared/dashboard";
import { Hono } from "hono";
import type { DashboardService } from "../services/dashboard-service.ts";

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const createDashboardController = (service: DashboardService) =>
  new Hono()
    .get(dashboardEndpoint, async (context) => {
      try {
        return context.json({ dashboard: await service.read() });
      } catch (error) {
        return context.json({ error: errorMessage(error, "Dashboard could not be loaded") }, 400);
      }
    })
    .post(
      dashboardEndpoint,
      zValidator("json", dashboardChangeSchema, (result, context) => {
        if (!result.success) return context.json({ error: result.error.message }, 400);
      }),
      async (context) => {
        try {
          const dashboard = await service.update(context.req.valid("json"));

          return context.json({ dashboard });
        } catch (error) {
          return context.json({ error: errorMessage(error, "Dashboard could not be saved") }, 400);
        }
      },
    )
    .get(pythonSourceEndpoint, zValidator("query", assetSourceQuerySchema), async (context) => {
      try {
        const source = await service.readPython(context.req.valid("query").path);

        return context.json({ source });
      } catch (error) {
        return context.json(
          { error: errorMessage(error, "Python source could not be loaded") },
          400,
        );
      }
    })
    .put(pythonSourceEndpoint, zValidator("query", assetSourceQuerySchema), async (context) => {
      try {
        const path = context.req.valid("query").path;

        await service.writePython(path, await context.req.text());

        return context.json({ path });
      } catch (error) {
        return context.json(
          { error: errorMessage(error, "Python source could not be saved") },
          400,
        );
      }
    })
    .get(inputSourceEndpoint, zValidator("query", assetSourceQuerySchema), async (context) => {
      try {
        const source = await service.readInput(context.req.valid("query").path);

        return context.json({ source });
      } catch (error) {
        return context.json(
          { error: errorMessage(error, "Input source could not be loaded") },
          400,
        );
      }
    })
    .get(assetsEndpoint, async (context) => {
      try {
        return context.json(await service.listAssets());
      } catch (error) {
        return context.json(
          { error: errorMessage(error, "Dashboard assets could not be listed") },
          500,
        );
      }
    })
    .post(buildEndpoint, async (context) => {
      try {
        return context.body(await service.build(), 200, {
          "Content-Disposition": 'attachment; filename="dashboard.html"',
          "Content-Type": "text/html; charset=utf-8",
        });
      } catch (error) {
        return context.json({ error: errorMessage(error, "Dashboard could not be built") }, 500);
      }
    });
