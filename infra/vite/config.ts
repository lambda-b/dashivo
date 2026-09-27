import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vite";
import { createServerApp } from "@dashlet/server/app";
import { createFilesystemDashboardRepository } from "@dashlet/infra/local/persistence/filesystem-dashboard-repository";
import clientViteConfig from "@dashlet/client/vite.config";
import { appServer } from "@dashlet/infra/vite/plugins/app-server";
import { pyodideAssets } from "@dashlet/infra/vite/plugins/pyodide-assets";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig((env) => {
  if (env.command !== "serve") return clientViteConfig;

  const serverApp = createServerApp({
    repository: createFilesystemDashboardRepository(projectRoot),
    projectRoot,
  });

  return mergeConfig(clientViteConfig, {
    plugins: [appServer(serverApp), pyodideAssets(projectRoot)],
  });
});
