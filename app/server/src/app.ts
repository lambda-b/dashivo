import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { registerDashboardRoutes } from "@dashlet/server/controllers/dashboard-controller";
import type { DashboardBuildService } from "@dashlet/server/models/dashboard-build-service";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";
import { createDashboardService } from "@dashlet/server/services/dashboard-service";

export interface ServerDependencies {
  buildService: DashboardBuildService;
  repository: DashboardRepository;
}

export const createServerApp = (dependencies: ServerDependencies) => {
  const service = createDashboardService(dependencies);
  const app = new Hono();

  app.onError((error, context) => {
    if (error instanceof HTTPException) {
      return context.json({ error: error.message }, error.status);
    }

    console.error(error);
    return context.json({ error: "Internal server error" }, 500);
  });
  registerDashboardRoutes(app, service);

  return app;
};
