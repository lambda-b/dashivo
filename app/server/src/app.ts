import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  configureServerContext,
  type ServerDependencies,
  type ServerEnv,
} from "@dashlet/server/context";
import { configureServerRoutes } from "@dashlet/server/router";
import { DashboardRevisionConflict } from "@dashlet/server/models/dashboard-revision-conflict";
import { DashboardNotFound } from "@dashlet/server/models/dashboard-not-found";

export const createServerApp = (dependencies: ServerDependencies) => {
  const app = new Hono<ServerEnv>();

  app.use("*", configureServerContext(dependencies));

  app.onError((error, context) => {
    if (error instanceof HTTPException) {
      return context.json({ error: error.message }, error.status);
    }

    if (error instanceof DashboardRevisionConflict) {
      return context.json({ error: error.message }, 409);
    }

    if (error instanceof DashboardNotFound) {
      return context.json({ error: error.message }, 404);
    }

    console.error(error);
    return context.json({ error: "Internal server error" }, 500);
  });

  configureServerRoutes(app);

  return app;
};
