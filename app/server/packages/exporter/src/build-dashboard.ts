import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build } from "vite";
import { preparePyodide } from "@dashlet/server-exporter/prepare/pyodide";
import { createViewerViteConfiguration } from "@dashlet/server-exporter/configuration";
import type {
  DashboardExportSource,
  DashboardHtmlBuilder,
} from "@dashlet/server/models/dashboard-html-builder";

const writeSource = async (root: string, { path: sourcePath, source }: DashboardExportSource) => {
  const destination = path.resolve(root, sourcePath);
  const relative = path.relative(root, destination);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Dashboard source must stay within the build directory: ${sourcePath}`);
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, "utf8");
};

export const createDashboardHtmlBuilder = (
  sourceRoot: string,
  assetCacheRoot = path.join(os.tmpdir(), "dashlet-pyodide-cache"),
): DashboardHtmlBuilder => {
  return async ({ dashboardId, dashboard, sources }) => {
    const dashboardRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-dashboard-"));
    const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-build-"));
    const dashboardPath = path.join(dashboardRoot, "dashboard.json");
    const dashboardCacheRoot = path.join(assetCacheRoot, dashboardId);

    try {
      await fs.writeFile(dashboardPath, JSON.stringify(dashboard), "utf8");
      await Promise.all(sources.map((source) => writeSource(dashboardRoot, source)));
      await preparePyodide(sourceRoot, dashboardPath, dashboardCacheRoot);
      await build({
        configFile: false,
        ...createViewerViteConfiguration(
          sourceRoot,
          dashboardPath,
          path.join(dashboardCacheRoot, "assets.ts"),
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
      await fs.rm(dashboardRoot, { recursive: true, force: true });
      await fs.rm(outputRoot, { recursive: true, force: true });
    }
  };
};
