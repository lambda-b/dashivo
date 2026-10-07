import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vite";
import { createServerApp } from "@dashivo/server/app";
import { createDashboardHtmlBuilder } from "@dashivo/server-exporter/build-dashboard";
import { createEditorViteConfiguration } from "@dashivo/shared-vite/editor";
import { createFilesystemDashboardRepository } from "@dashivo/infra/local/persistence/filesystem-dashboard-repository";
import { appServer } from "@dashivo/infra/local/vite/editor/plugins/app-server";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const editorViteConfig = createEditorViteConfiguration(projectRoot);

export default defineConfig((env) => {
  if (env.command !== "serve") return editorViteConfig;

  const serverApp = createServerApp({
    dashboardHtmlBuilder: createDashboardHtmlBuilder(projectRoot),
    repository: createFilesystemDashboardRepository(projectRoot),
  });

  return mergeConfig(editorViteConfig, {
    plugins: [appServer(serverApp)],
  });
});
