import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, type UserConfig } from "vite";
import { createDashboardViteConfiguration } from "@dashlet/shared-vite/common";
import { analysisAssets } from "@dashlet/shared-vite/common/plugins/analysis-assets";

export const createEditorViteConfiguration = (projectRoot: string): UserConfig => {
  const clientRoot = path.join(projectRoot, "app/client");
  const dashboardPath = path.join(projectRoot, "dashboard", "dashboard.json");
  const pyodideRuntimePath = fileURLToPath(
    new URL("./editor/virtual/pyodide-runtime.ts", import.meta.url),
  );

  return mergeConfig(
    createDashboardViteConfiguration(clientRoot, dashboardPath, pyodideRuntimePath),
    {
      optimizeDeps: {
        entries: ["index.html", "src/ports/workers/python/analysis.worker.ts"],
        include: ["comlink", "pyodide"],
      },
      server: {
        host: "0.0.0.0",
        port: 3030,
        strictPort: true,
        fs: { allow: [projectRoot] },
      },
      worker: { plugins: () => [analysisAssets(dashboardPath)] },
    },
  );
};
