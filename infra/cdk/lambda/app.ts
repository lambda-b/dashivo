import { handle } from "hono/aws-lambda";
import { createAuthenticatedServerApp } from "@dashivo/server/authentication";

export const createLambdaHandler = (
  dependencies: Parameters<typeof createAuthenticatedServerApp>[0],
) => handle(createAuthenticatedServerApp(dependencies));
