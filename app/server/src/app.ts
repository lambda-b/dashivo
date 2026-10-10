import { Hono, type MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { bodyLimit } from "hono/body-limit";
import {
  configureServerContext,
  type ServerDependencyProvider,
  type ServerEnv,
} from "@dashivo/server/context";
import { configureServerRoutes } from "@dashivo/server/router";
import { DashboardRevisionConflict } from "@dashivo/server/models/dashboard-revision-conflict";
import { DashboardNotFound } from "@dashivo/server/models/dashboard-not-found";
import { InputSourceConflict } from "@dashivo/server/models/input-source-conflict";
import { DashboardIdConflict } from "@dashivo/server/models/dashboard-id-conflict";

export const createServerApp = (
  dependencies: ServerDependencyProvider,
  beforeServices?: MiddlewareHandler<ServerEnv>,
) => {
  const app = new Hono<ServerEnv>();

  app.use("*", async (context, next) => {
    await next();
    context.header("Cache-Control", "no-store");
  });
  app.use(
    "*",
    bodyLimit({
      maxSize: 4_000_000,
      onError: (context) =>
        context.json({ error: "送信データが大きすぎます。4MB以内にしてください。" }, 413),
    }),
  );

  if (beforeServices) app.use("*", beforeServices);
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

    if (error instanceof DashboardIdConflict) {
      return context.json({ error: error.message }, 409);
    }

    console.error(error);
    return context.json({ error: "Internal server error" }, 500);
  });

  configureServerRoutes(app);

  return app;
};
