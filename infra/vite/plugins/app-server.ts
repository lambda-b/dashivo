import { getRequestListener } from "@hono/node-server";
import {
  assetsEndpoint,
  dashboardEndpoint,
  inputSourceEndpoint,
  pythonSourceEndpoint,
} from "@dashlet/shared/api";
import type { Env, Hono } from "hono";
import type { Plugin } from "vite";

const apiPaths: ReadonlySet<string> = new Set([
  "/api/dashboards",
  assetsEndpoint,
  dashboardEndpoint,
  inputSourceEndpoint,
  pythonSourceEndpoint,
]);

const isApiPath = (pathname: string) =>
  apiPaths.has(pathname) ||
  /^\/api\/dashboards\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/(?:download|python-logics))?$/.test(pathname);

export const appServer = <E extends Env>(app: Hono<E>): Plugin => {
  const listener = getRequestListener(app.fetch);

  return {
    name: "dashlet-app-server",
    apply: "serve",
    handleHotUpdate: ({ file }) => (file.includes("/dashboard/") ? [] : undefined),
    configureServer: (server) => {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");

        if (!isApiPath(url.pathname)) {
          next();
          return;
        }

        return listener(request, response);
      });
    },
  };
};
