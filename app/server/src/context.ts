import type { DashboardRepository } from "@dashivo/server/models/dashboard-repository";
import type { DashboardHtmlBuilder } from "@dashivo/server/models/dashboard-html-builder";
import { createDashboardAssetService } from "@dashivo/server/services/dashboard-asset-service";
import { createDashboardDefinitionService } from "@dashivo/server/services/dashboard-definition-service";
import { createDashboardDownloadService } from "@dashivo/server/services/dashboard-download-service";
import { createPythonLogicService } from "@dashivo/server/services/python-logic-service";
import type { DashboardAssetService } from "@dashivo/server/services/dashboard-asset-service";
import type { DashboardDefinitionService } from "@dashivo/server/services/dashboard-definition-service";
import type { DashboardDownloadService } from "@dashivo/server/services/dashboard-download-service";
import type { PythonLogicService } from "@dashivo/server/services/python-logic-service";
import type { MiddlewareHandler } from "hono";

export interface ServerDependencies {
  repository: DashboardRepository;
  dashboardHtmlBuilder: DashboardHtmlBuilder;
}

export type ServerEnv = {
  Variables: {
    assetService: DashboardAssetService;
    dashboardDefinitionService: DashboardDefinitionService;
    dashboardDownloadService: DashboardDownloadService;
    pythonLogicService: PythonLogicService;
  };
};

export type ServerServices = ServerEnv["Variables"];

export const configureServerContext = ({
  dashboardHtmlBuilder,
  repository,
}: ServerDependencies) => {
  const services: ServerServices = {
    assetService: createDashboardAssetService(repository),
    dashboardDefinitionService: createDashboardDefinitionService(repository),
    dashboardDownloadService: createDashboardDownloadService(repository, dashboardHtmlBuilder),
    pythonLogicService: createPythonLogicService(repository),
  };

  const provideServices: MiddlewareHandler<ServerEnv> = async (context, next) => {
    context.set("assetService", services.assetService);
    context.set("dashboardDefinitionService", services.dashboardDefinitionService);
    context.set("dashboardDownloadService", services.dashboardDownloadService);
    context.set("pythonLogicService", services.pythonLogicService);

    await next();
  };

  return provideServices;
};
