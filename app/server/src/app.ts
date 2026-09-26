import { Hono } from "hono";
import { createDashboardController } from "./controllers/dashboard-controller.ts";
import type { DashboardBuildService } from "./models/dashboard-build-service.ts";
import type { DashboardRepository } from "./models/dashboard-repository.ts";
import { createDashboardService } from "./services/dashboard-service.ts";

export interface ServerDependencies {
  buildService: DashboardBuildService;
  repository: DashboardRepository;
}

export const createServerApp = (dependencies: ServerDependencies) => {
  const service = createDashboardService(dependencies);

  return new Hono().route("/", createDashboardController(service));
};
