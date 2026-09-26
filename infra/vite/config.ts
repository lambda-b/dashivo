import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServerApp } from "@dashlet/server/app";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { createFilesystemDashboardBuildService } from "../build/filesystem-dashboard-build-service.ts";
import { createFilesystemDashboardRepository } from "../persistence/filesystem-dashboard-repository.ts";
import { analysisAssets } from "./plugins/analysis-assets.ts";
import { appServer } from "./plugins/app-server.ts";
import { appTarget as appTargetPlugin } from "./plugins/app-target.ts";
import { browserOnlyWorker } from "./plugins/browser-only-worker.ts";
import { dashboardOutput } from "./plugins/dashboard-output.ts";
import { pyodideAssets } from "./plugins/pyodide-assets.ts";
import { pyodideRuntime } from "./plugins/pyodide-runtime.ts";

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
