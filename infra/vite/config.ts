import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServerApp } from "@dashlet/server/app";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { createFilesystemDashboardBuildService } from "@dashlet/infra/build/filesystem-dashboard-build-service";
import { createFilesystemDashboardRepository } from "@dashlet/infra/persistence/filesystem-dashboard-repository";
import { analysisAssets } from "@dashlet/infra/vite/plugins/analysis-assets";
import { appServer } from "@dashlet/infra/vite/plugins/app-server";
import { appTarget as appTargetPlugin } from "@dashlet/infra/vite/plugins/app-target";
import { browserOnlyWorker } from "@dashlet/infra/vite/plugins/browser-only-worker";
import { dashboardOutput } from "@dashlet/infra/vite/plugins/dashboard-output";
import { pyodideAssets } from "@dashlet/infra/vite/plugins/pyodide-assets";
import { pyodideRuntime } from "@dashlet/infra/vite/plugins/pyodide-runtime";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const clientRoot = path.join(projectRoot, "app/client");
const serverApp = createServerApp({
  buildService: createFilesystemDashboardBuildService(projectRoot),
  repository: createFilesystemDashboardRepository(projectRoot),
});

export default defineConfig(({ command, mode }) => {
  const target = command === "serve" || mode === "editor" ? "editor" : "viewer";

  return {
    root: clientRoot,
    resolve: {
      tsconfigPaths: true,
    },
    optimizeDeps: {
      entries: ["index.html", "src/ports/workers/python/analysis.worker.ts"],
      include: ["comlink", "pyodide"],
    },
    plugins: [
      react(),
      tailwindcss(),
      appTargetPlugin(target),
      analysisAssets(projectRoot),
      target === "editor" && command === "serve" && appServer(serverApp),
      pyodideRuntime(projectRoot, command),
      command === "serve" && pyodideAssets(projectRoot),
      target === "viewer" && viteSingleFile(),
      target === "viewer" && dashboardOutput(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3030,
      strictPort: true,
      fs: {
        allow: [projectRoot],
      },
    },
    worker: {
      format: "iife",
      plugins: () => [
        browserOnlyWorker(),
        analysisAssets(projectRoot),
        pyodideRuntime(projectRoot, command),
      ],
      rollupOptions: {
        output: {
          banner: "globalThis.importScripts = undefined;",
          codeSplitting: false,
        },
      },
    },
    build: {
      outDir: path.join(projectRoot, "dist"),
      emptyOutDir: true,
      target: "es2022",
      assetsInlineLimit: Number.POSITIVE_INFINITY,
      chunkSizeWarningLimit: 100_000,
      rollupOptions: {
        output: {
          entryFileNames: "dashboard.js",
          assetFileNames: "dashboard.[ext]",
        },
      },
    },
  };
});
