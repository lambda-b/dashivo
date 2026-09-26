import { getRequestListener } from "@hono/node-server";
import {
  assetsEndpoint,
  buildEndpoint,
  dashboardEndpoint,
  inputSourceEndpoint,
  pythonSourceEndpoint,
} from "@dashlet/shared/api";
import type { Hono } from "hono";
import type { Plugin } from "vite";

const apiPaths: ReadonlySet<string> = new Set([
  assetsEndpoint,
  buildEndpoint,
  dashboardEndpoint,
  inputSourceEndpoint,
  pythonSourceEndpoint,
]);

export const appServer = (app: Hono): Plugin => {
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
