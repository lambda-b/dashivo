import { getRequestListener } from "@hono/node-server";
import type { Env, Hono } from "hono";
import type { Plugin } from "vite";

export const appServer = <E extends Env>(app: Hono<E>): Plugin => {
  const listener = getRequestListener(app.fetch);

  return {
    name: "dashlet-app-server",
    apply: "serve",
    handleHotUpdate: ({ file }) => (file.includes("/dashboard/") ? [] : undefined),
    configureServer: (server) => {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");

        if (!url.pathname.startsWith("/api/")) {
          next();
          return;
        }

        return listener(request, response);
      });
    },
  };
};
