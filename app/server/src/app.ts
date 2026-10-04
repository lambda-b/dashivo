import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  configureServerContext,
  type ServerDependencies,
  type ServerEnv,
} from "@dashivo/server/context";
import { configureServerRoutes } from "@dashivo/server/router";
import { DashboardRevisionConflict } from "@dashivo/server/models/dashboard-revision-conflict";
import { DashboardNotFound } from "@dashivo/server/models/dashboard-not-found";
import { InputSourceConflict } from "@dashivo/server/models/input-source-conflict";
import { InputSourceAccessDenied } from "@dashivo/server/models/input-source-access-denied";

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

    if (error instanceof InputSourceConflict) {
      return context.json({ error: error.message }, 409);
    }

    if (error instanceof InputSourceAccessDenied) {
      return context.json({ error: error.message }, 403);
    }

    console.error(error);
    return context.json({ error: "Internal server error" }, 500);
  });

  configureServerRoutes(app);

  return app;
};
