import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { bodyLimit } from "hono/body-limit";
import { createAuthenticatedServerApp } from "@dashivo/server/authentication";

export const createLambdaHandler = (
  dependencies: Parameters<typeof createAuthenticatedServerApp>[0],
) => {
  const app = new Hono();

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
  app.route("/", createAuthenticatedServerApp(dependencies));

  return handle(app);
};
