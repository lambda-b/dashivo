import path from "node:path";
import type { ConfigEnv, UserConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createServerApp } from "@dashlet/server/app";
import { createFilesystemDashboardBuildService } from "@dashlet/infra/build/filesystem-dashboard-build-service";
import { createFilesystemDashboardRepository } from "@dashlet/infra/persistence/filesystem-dashboard-repository";
import { analysisAssets } from "@dashlet/infra/vite/plugins/analysis-assets";
import { appServer } from "@dashlet/infra/vite/plugins/app-server";
import { appTarget as appTargetPlugin } from "@dashlet/infra/vite/plugins/app-target";
import { browserOnlyWorker } from "@dashlet/infra/vite/plugins/browser-only-worker";
import { dashboardDefinition } from "@dashlet/infra/vite/plugins/dashboard-definition";
import { dashboardOutput } from "@dashlet/infra/vite/plugins/dashboard-output";
import { pyodideAssets } from "@dashlet/infra/vite/plugins/pyodide-assets";
import { pyodideRuntime } from "@dashlet/infra/vite/plugins/pyodide-runtime";

export const createViteConfiguration = (
  projectRoot: string,
  env: ConfigEnv,
  dashboardPath = path.join(projectRoot, "dashboard", "dashboard.json"),
  generatedAssetsPath?: string,
): UserConfig => {
  const clientRoot = path.join(projectRoot, "app/client");
  const target = env.command === "serve" || env.mode === "editor" ? "editor" : "viewer";
  const serverApp = createServerApp({
    buildService: createFilesystemDashboardBuildService(projectRoot),
    repository: createFilesystemDashboardRepository(projectRoot),
  });

  return {
    root: clientRoot,
    resolve: {
      tsconfigPaths: true,
      alias: generatedAssetsPath ? { "#generated/assets": generatedAssetsPath } : undefined,
    },
    optimizeDeps: {
      entries: ["index.html", "src/ports/workers/python/analysis.worker.ts"],
      include: ["comlink", "pyodide"],
    },
    plugins: [
      react(),
      tailwindcss(),
      dashboardDefinition(dashboardPath),
      appTargetPlugin(target),
      analysisAssets(projectRoot, dashboardPath),
      target === "editor" && env.command === "serve" && appServer(serverApp),
      pyodideRuntime(projectRoot, env.command),
      env.command === "serve" && pyodideAssets(projectRoot),
      target === "viewer" && viteSingleFile(),
      target === "viewer" && dashboardOutput(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3030,
      strictPort: true,
      fs: { allow: [projectRoot] },
    },
    worker: {
      format: "iife",
      plugins: () => [
        browserOnlyWorker(),
        dashboardDefinition(dashboardPath),
        analysisAssets(projectRoot, dashboardPath),
        pyodideRuntime(projectRoot, env.command),
      ],
      rollupOptions: {
        output: { banner: "globalThis.importScripts = undefined;", codeSplitting: false },
      },
    },
    build: {
      outDir: path.join(projectRoot, "dist"),
      emptyOutDir: true,
      target: "es2022",
      assetsInlineLimit: Number.POSITIVE_INFINITY,
      chunkSizeWarningLimit: 100_000,
      rollupOptions: {
        output: { entryFileNames: "dashboard.js", assetFileNames: "dashboard.[ext]" },
      },
    },
  };
};
