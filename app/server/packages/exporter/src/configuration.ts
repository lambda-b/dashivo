import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type UserConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { analysisAssets } from "@dashlet/shared/vite/plugins/analysis-assets";
import { createDashboardViteConfiguration } from "@dashlet/shared/vite/configuration";
import { dashboardOutput } from "@dashlet/server-exporter/plugins/dashboard-output";
import { pyodideWasm } from "@dashlet/server-exporter/plugins/pyodide-wasm";

export const createViewerViteConfiguration = (
  projectRoot: string,
  dashboardPath = path.join(projectRoot, "dashboard", "dashboard.json"),
  generatedAssetsPath = path.join(projectRoot, ".pyodide-cache", "assets.ts"),
): UserConfig =>
  mergeConfig(
    createDashboardViteConfiguration(
      projectRoot,
      dashboardPath,
      path.join(projectRoot, "app/server/packages/exporter/src/pyodide-runtime.ts"),
    ),
    {
      resolve: {
        alias: {
          "#generated/assets": generatedAssetsPath,
          "@/app/App": path.join(projectRoot, "app/client/src/app/ViewerApp.tsx"),
        },
      },
      plugins: [pyodideWasm(), viteSingleFile(), dashboardOutput()],
      worker: { plugins: () => [analysisAssets(dashboardPath), pyodideWasm()] },
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
    },
  );

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../");

export default defineConfig(() => createViewerViteConfiguration(projectRoot));
