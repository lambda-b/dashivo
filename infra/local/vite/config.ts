import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vite";
import { createServerApp } from "@dashlet/server/app";
import { createDashboardHtmlBuilder } from "@dashlet/server-exporter/build-dashboard";
import { createEditorViteConfiguration } from "@dashlet/shared-vite/editor";
import { createFilesystemDashboardRepository } from "@dashlet/infra/local/persistence/filesystem-dashboard-repository";
import { appServer } from "@dashlet/infra/local/vite/plugins/app-server";
import { pyodideAssets } from "@dashlet/infra/local/vite/plugins/pyodide-assets";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const editorViteConfig = createEditorViteConfiguration(projectRoot);

export default defineConfig((env) => {
  if (env.command !== "serve") return editorViteConfig;

  const serverApp = createServerApp({
    dashboardHtmlBuilder: createDashboardHtmlBuilder(projectRoot),
    repository: createFilesystemDashboardRepository(projectRoot),
  });

  return mergeConfig(editorViteConfig, {
    plugins: [appServer(serverApp), pyodideAssets(projectRoot)],
  });
});
