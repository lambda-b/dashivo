import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build } from "vite";
import { preparePyodide } from "@dashlet/server/export/prepare/pyodide";
import { createViewerViteConfiguration } from "@dashlet/server/export/configuration";

export const buildDashboard = async (
  sourceRoot: string,
  dashboardPath: string,
  assetCacheRoot = path.join(sourceRoot, ".pyodide-cache"),
) => {
  const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-build-"));

  try {
    await preparePyodide(sourceRoot, dashboardPath, assetCacheRoot);
    await build({
      configFile: false,
      ...createViewerViteConfiguration(
        sourceRoot,
        dashboardPath,
        path.join(assetCacheRoot, "assets.ts"),
      ),
      mode: "viewer",
      logLevel: "error",
      build: {
        outDir: outputRoot,
        emptyOutDir: true,
      },
      define: { "import.meta.env.DEV": "false" },
    });

    const html = await fs.readFile(path.join(outputRoot, "dashboard.html"));
    return Uint8Array.from(html).buffer;
  } finally {
    await fs.rm(outputRoot, { recursive: true, force: true });
  }
};
