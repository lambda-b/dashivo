import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, type UserConfig } from "vite";
import { createDashboardViteConfiguration } from "@dashivo/shared-vite/common";
import { pyodideAssets } from "@dashivo/shared-vite/editor/plugins/pyodide-assets";

export const createEditorViteConfiguration = (projectRoot: string): UserConfig => {
  const clientRoot = path.join(projectRoot, "app/client");
  const pyodideRuntimePath = fileURLToPath(
    new URL("./editor/virtual/pyodide-runtime.ts", import.meta.url),
  );

  return mergeConfig(createDashboardViteConfiguration(clientRoot, pyodideRuntimePath), {
    resolve: {
      alias: {
        "virtual:dashivo/dashboard": fileURLToPath(
          new URL("./editor/virtual/dashboard.ts", import.meta.url),
        ),
        "virtual:dashivo/analysis-assets": fileURLToPath(
          new URL("./editor/virtual/analysis-assets.ts", import.meta.url),
        ),
      },
    },
    plugins: [pyodideAssets(projectRoot)],
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
    build: { outDir: path.join(projectRoot, "dist/editor"), emptyOutDir: true },
  });
};
