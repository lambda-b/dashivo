import type { DashboardRepository } from "@dashivo/server/models/dashboard-repository";
import type {
  DashboardHtmlBuilder,
  DashboardDownloadStorage,
} from "@dashivo/server/models/dashboard-html-builder";
import { createDashboardAssetService } from "@dashivo/server/services/dashboard-asset-service";
import { createDashboardDefinitionService } from "@dashivo/server/services/dashboard-definition-service";
import { createDashboardDownloadService } from "@dashivo/server/services/dashboard-download-service";
import { createPythonLogicService } from "@dashivo/server/services/python-logic-service";
import type { DashboardAssetService } from "@dashivo/server/services/dashboard-asset-service";
import type { DashboardDefinitionService } from "@dashivo/server/services/dashboard-definition-service";
import type { DashboardDownloadService } from "@dashivo/server/services/dashboard-download-service";
import type { PythonLogicService } from "@dashivo/server/services/python-logic-service";
import type { Context, MiddlewareHandler } from "hono";

export interface ServerDependencies {
  repository: DashboardRepository;
  dashboardHtmlBuilder: DashboardHtmlBuilder;
  dashboardDownloadStorage: DashboardDownloadStorage;
}

export type ServerEnv = {
  Variables: {
    assetService: DashboardAssetService;
    dashboardDefinitionService: DashboardDefinitionService;
    dashboardDownloadService: DashboardDownloadService;
    pythonLogicService: PythonLogicService;
    userId?: string;
  };
};

export type ServerServices = Omit<ServerEnv["Variables"], "userId">;
export type ServerDependencyProvider =
  | ServerDependencies
  | ((context: Context<ServerEnv>) => ServerDependencies);

const createServices = ({
  dashboardHtmlBuilder,
  dashboardDownloadStorage,
  repository,
}: ServerDependencies): ServerServices => ({
  assetService: createDashboardAssetService(repository),
  dashboardDefinitionService: createDashboardDefinitionService(repository),
  dashboardDownloadService: createDashboardDownloadService(
    repository,
    dashboardHtmlBuilder,
    dashboardDownloadStorage,
  ),
  pythonLogicService: createPythonLogicService(repository),
});

export const configureServerContext = (dependencies: ServerDependencyProvider) => {
  const serviceProvider =
    typeof dependencies === "function"
      ? (context: Context<ServerEnv>) => createServices(dependencies(context))
      : createServices(dependencies);

  const provideServices: MiddlewareHandler<ServerEnv> = async (context, next) => {
    const services =
      typeof serviceProvider === "function" ? serviceProvider(context) : serviceProvider;
    context.set("assetService", services.assetService);
    context.set("dashboardDefinitionService", services.dashboardDefinitionService);
    context.set("dashboardDownloadService", services.dashboardDownloadService);
    context.set("pythonLogicService", services.pythonLogicService);

    await next();
  };

  return provideServices;
};
