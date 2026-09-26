import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build } from "vite";
import { preparePyodide } from "../vite/prepare/pyodide.ts";
import { pathToFileURL } from "node:url";

export const buildDashboard = async (
  sourceRoot: string,
  dashboardPath: string,
  assetCacheRoot = path.join(sourceRoot, ".pyodide-cache"),
) => {
  const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-build-"));
  const configRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-config-"));

  try {
    await preparePyodide(sourceRoot, dashboardPath, assetCacheRoot);
    const configPath = path.join(configRoot, "vite.config.mjs");
    const configurationModule = pathToFileURL(
      path.join(sourceRoot, "infra/vite/configuration.ts"),
    ).href;
    await fs.writeFile(
      configPath,
      [
        `import { createViteConfiguration } from ${JSON.stringify(configurationModule)};`,
        `export default (env) => createViteConfiguration(${JSON.stringify(sourceRoot)}, env, ${JSON.stringify(dashboardPath)}, ${JSON.stringify(path.join(assetCacheRoot, "assets.ts"))});`,
        "",
      ].join("\n"),
    );
    await build({
      configFile: configPath,
      mode: "viewer",
      logLevel: "error",
      build: {
        outDir: outputRoot,
        emptyOutDir: true,
      },
      define: { "import.meta.env.DEV": "false" },
    });

    return await fs.readFile(path.join(outputRoot, "dashboard.html"));
  } finally {
    await Promise.all([
      fs.rm(outputRoot, { recursive: true, force: true }),
      fs.rm(configRoot, { recursive: true, force: true }),
    ]);
  }
};
