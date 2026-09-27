import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";
import { createDashboardAssetService } from "@dashlet/server/services/dashboard-asset-service";
import { createDashboardDefinitionService } from "@dashlet/server/services/dashboard-definition-service";
import { createDashboardDownloadService } from "@dashlet/server/services/dashboard-download-service";
import type { DashboardHtmlBuilder } from "@dashlet/server/services/dashboard-download-service";
import { createPythonLogicService } from "@dashlet/server/services/python-logic-service";
import type { DashboardAssetService } from "@dashlet/server/services/dashboard-asset-service";
import type { DashboardDefinitionService } from "@dashlet/server/services/dashboard-definition-service";
import type { DashboardDownloadService } from "@dashlet/server/services/dashboard-download-service";
import type { PythonLogicService } from "@dashlet/server/services/python-logic-service";
import type { MiddlewareHandler } from "hono";

export interface ServerDependencies {
  projectRoot: string;
  repository: DashboardRepository;
  dashboardHtmlBuilder?: DashboardHtmlBuilder;
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
  projectRoot,
  repository,
}: ServerDependencies) => {
  const services: ServerServices = {
    assetService: createDashboardAssetService(repository),
    dashboardDefinitionService: createDashboardDefinitionService(repository),
    dashboardDownloadService: createDashboardDownloadService(
      repository,
      projectRoot,
      dashboardHtmlBuilder,
    ),
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
