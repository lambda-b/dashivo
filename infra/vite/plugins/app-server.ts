import { getRequestListener } from "@hono/node-server";
import {
  assetsEndpoint,
  dashboardEndpoint,
  downloadEndpoint,
  inputSourceEndpoint,
  pythonLogicEndpoint,
  pythonSourceEndpoint,
} from "@dashlet/shared/api";
import type { Env, Hono } from "hono";
import type { Plugin } from "vite";

const apiPaths: ReadonlySet<string> = new Set([
  assetsEndpoint,
  dashboardEndpoint,
  downloadEndpoint,
  inputSourceEndpoint,
  pythonLogicEndpoint,
  pythonSourceEndpoint,
]);

export const appServer = <E extends Env>(app: Hono<E>): Plugin => {
  const listener = getRequestListener(app.fetch);

  return {
    name: "dashlet-app-server",
    apply: "serve",
    handleHotUpdate: ({ file }) => (file.includes("/dashboard/") ? [] : undefined),
    configureServer: (server) => {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");

        if (!apiPaths.has(url.pathname)) {
          next();
          return;
        }

        return listener(request, response);
      });
    },
  };
};
