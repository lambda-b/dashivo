import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { analysisAssets } from "./vite/plugins/analysis-assets.ts";
import { appTarget as appTargetPlugin } from "./vite/plugins/app-target.ts";
import { dashboardAssets } from "./vite/plugins/dashboard-assets.ts";
import { browserOnlyWorker } from "./vite/plugins/browser-only-worker.ts";
import { dashboardEditor } from "./vite/plugins/dashboard-editor.ts";
import { dashboardDownload } from "./vite/plugins/dashboard-download.ts";
import { dashboardOutput } from "./vite/plugins/dashboard-output.ts";
import { pyodideAssets } from "./vite/plugins/pyodide-assets.ts";
import { pyodideRuntime } from "./vite/plugins/pyodide-runtime.ts";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const target = command === "serve" || mode === "editor" ? "editor" : "viewer";

  return {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      react(),
      tailwindcss(),
      appTargetPlugin(target),
      analysisAssets(projectRoot),
      target === "editor" && command === "serve" && dashboardAssets(projectRoot),
      pyodideRuntime(projectRoot, command),
      target === "editor" && command === "serve" && dashboardEditor(projectRoot),
      target === "editor" && command === "serve" && dashboardDownload(projectRoot),
      command === "serve" && pyodideAssets(projectRoot),
      target === "viewer" && viteSingleFile(),
      target === "viewer" && dashboardOutput(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3030,
      strictPort: true,
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
      outDir: "dist",
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
