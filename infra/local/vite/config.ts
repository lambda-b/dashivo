import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vite";
import { createServerApp } from "@dashivo/server/app";
import { createDashboardHtmlBuilder } from "@dashivo/server-exporter/build-dashboard";
import { createEditorViteConfiguration } from "@dashivo/shared-vite/editor";
import { createFilesystemDashboardRepository } from "@dashivo/infra/local/persistence/filesystem-dashboard-repository";
import { createFilesystemDashboardDownloadStorage } from "@dashivo/infra/local/persistence/filesystem-dashboard-download-storage";
import { appServer } from "@dashivo/infra/local/vite/editor/plugins/app-server";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const editorViteConfig = createEditorViteConfiguration(projectRoot);

export default defineConfig((env) => {
  if (env.command !== "serve") return editorViteConfig;

  const downloads = createFilesystemDashboardDownloadStorage(
    path.join(projectRoot, ".cache/downloads"),
  );
  const serverApp = createServerApp({
    dashboardHtmlBuilder: createDashboardHtmlBuilder(projectRoot),
    dashboardDownloadStorage: downloads.save,
    repository: createFilesystemDashboardRepository(projectRoot),
  });
  serverApp.get("/api/downloads/:token/:id", async (context) =>
    context.body(await downloads.read(context.req.param("token"), context.req.param("id")), 200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${context.req.param("id")}.html"`,
    }),
  );

  return mergeConfig(editorViteConfig, {
    plugins: [appServer(serverApp)],
  });
});
