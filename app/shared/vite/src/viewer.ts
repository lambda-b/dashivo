import { fileURLToPath } from "node:url";
import { mergeConfig, type UserConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { createDashboardViteConfiguration } from "@dashivo/shared-vite/common";
import { analysisAssets } from "@dashivo/shared-vite/viewer/plugins/analysis-assets";
import { dashboardOutput } from "@dashivo/shared-vite/viewer/plugins/dashboard-output";
import { pyodideWasm } from "@dashivo/shared-vite/viewer/plugins/pyodide-wasm";

const viewerRuntimePath = fileURLToPath(
  new URL("./viewer/virtual/pyodide-runtime.ts", import.meta.url),
);

export interface ViewerVitePaths {
  clientRoot: string;
  dashboardPath: string;
  dashboardRoot: string;
  generatedAssetsPath: string;
  outputRoot: string;
  viewerEntryPath: string;
}

export const createViewerViteConfiguration = ({
  clientRoot,
  dashboardPath,
  dashboardRoot,
  generatedAssetsPath,
  outputRoot,
  viewerEntryPath,
}: ViewerVitePaths): UserConfig =>
  mergeConfig(createDashboardViteConfiguration(clientRoot, viewerRuntimePath), {
    resolve: {
      alias: {
        "#generated/assets": generatedAssetsPath,
        "@/app/App": viewerEntryPath,
      },
    },
    plugins: [
      analysisAssets(dashboardPath, dashboardRoot),
      pyodideWasm(),
      viteSingleFile(),
      dashboardOutput(),
    ],
    worker: { plugins: () => [analysisAssets(dashboardPath, dashboardRoot), pyodideWasm()] },
    build: {
      outDir: outputRoot,
      emptyOutDir: true,
      copyPublicDir: false,
      target: "es2022",
      assetsInlineLimit: Number.POSITIVE_INFINITY,
      chunkSizeWarningLimit: 100_000,
      rollupOptions: {
        output: { entryFileNames: "dashboard.js", assetFileNames: "dashboard.[ext]" },
      },
    },
  });
