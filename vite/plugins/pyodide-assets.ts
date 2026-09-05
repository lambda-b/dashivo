import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const pyodideCoreAssets = new Set([
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "pyodide-lock.json",
  "python_stdlib.zip",
]);

export const pyodideAssets = (projectRoot: string): Plugin => ({
  name: "dashlet-pyodide-assets",
  apply: "serve",
  configureServer: (server) => {
    server.middlewares.use("/pyodide/", (request, response, next) => {
      const pathname = new URL(request.url ?? "", "http://localhost").pathname;
      const name = decodeURIComponent(pathname).replace(/^\/+/, "");
      if (!name || path.basename(name) !== name) return next();

      const assetRoot = pyodideCoreAssets.has(name)
        ? path.join(projectRoot, "node_modules", "pyodide")
        : path.join(projectRoot, ".pyodide-cache");
      const assetPath = path.join(assetRoot, name);
      if (!fs.existsSync(assetPath)) return next();

      response.statusCode = 200;
      response.setHeader(
        "Content-Type",
        name.endsWith(".mjs")
          ? "text/javascript"
          : name.endsWith(".wasm")
            ? "application/wasm"
            : name.endsWith(".json")
              ? "application/json"
              : "application/octet-stream",
      );
      response.end(fs.readFileSync(assetPath));
    });
  },
});
