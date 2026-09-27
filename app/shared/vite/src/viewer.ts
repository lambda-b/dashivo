import { mergeConfig, type UserConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { createDashboardViteConfiguration } from "@dashlet/shared-vite/common";
import { analysisAssets } from "@dashlet/shared-vite/plugins/analysis-assets";
import { dashboardOutput } from "@dashlet/shared-vite/plugins/dashboard-output";
import { pyodideWasm } from "@dashlet/shared-vite/plugins/pyodide-wasm";

export interface ViewerVitePaths {
  clientRoot: string;
  dashboardPath: string;
  generatedAssetsPath: string;
  outputRoot: string;
  pyodideRuntimePath: string;
  viewerEntryPath: string;
}

export const createViewerViteConfiguration = ({
  clientRoot,
  dashboardPath,
  generatedAssetsPath,
  outputRoot,
  pyodideRuntimePath,
  viewerEntryPath,
}: ViewerVitePaths): UserConfig =>
  mergeConfig(createDashboardViteConfiguration(clientRoot, dashboardPath, pyodideRuntimePath), {
    resolve: {
      alias: {
        "#generated/assets": generatedAssetsPath,
        "@/app/App": viewerEntryPath,
      },
    },
    plugins: [pyodideWasm(), viteSingleFile(), dashboardOutput()],
    worker: { plugins: () => [analysisAssets(dashboardPath), pyodideWasm()] },
    build: {
      outDir: outputRoot,
      emptyOutDir: true,
      target: "es2022",
      assetsInlineLimit: Number.POSITIVE_INFINITY,
      chunkSizeWarningLimit: 100_000,
      rollupOptions: {
        output: { entryFileNames: "dashboard.js", assetFileNames: "dashboard.[ext]" },
      },
    },
  });
