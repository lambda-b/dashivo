import { HTTPException } from "hono/http-exception";
import { createServerApp } from "@dashivo/server/app";
import type { DashboardRepository } from "@dashivo/server/models/dashboard-repository";
import type { DashboardHtmlBuilder } from "@dashivo/server/models/dashboard-html-builder";

interface AuthenticatedServerDependencies {
  verifyAccessToken: (token: string) => Promise<{ sub: string }>;
  repositoryForUser: (userId: string) => DashboardRepository;
  dashboardHtmlBuilder: DashboardHtmlBuilder;
}

export const createAuthenticatedServerApp = ({
  verifyAccessToken,
  repositoryForUser,
  dashboardHtmlBuilder,
}: AuthenticatedServerDependencies) =>
  createServerApp(
    (context) => {
      const userId = context.get("userId");
      if (!userId) throw new HTTPException(401, { message: "Unauthorized" });
      return { repository: repositoryForUser(userId), dashboardHtmlBuilder };
    },
    async (context, next) => {
      const token = context.req.header("X-Dashivo-Token");
      if (!token) throw new HTTPException(401, { message: "Unauthorized" });
      const { sub } = await verifyAccessToken(token);
      if (!sub) throw new HTTPException(401, { message: "Unauthorized" });
      context.set("userId", sub);
      await next();
    },
  );
