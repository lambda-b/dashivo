import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vite";
import { analysisAssets } from "@dashlet/shared/vite/analysis-assets";
import { createDashboardViteConfiguration } from "@dashlet/shared/vite/configuration";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dashboardPath = path.join(projectRoot, "dashboard", "dashboard.json");
const pyodideRuntimePath = path.join(projectRoot, "app/client/vite/pyodide-runtime.ts");

export default defineConfig(
  mergeConfig(createDashboardViteConfiguration(projectRoot, dashboardPath, pyodideRuntimePath), {
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
  }),
);
