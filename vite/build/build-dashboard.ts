import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build } from "vite";
import { preparePyodide } from "../prepare/pyodide.ts";

export const buildDashboard = async (sourceRoot: string) => {
  const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-build-"));

  try {
    await preparePyodide(sourceRoot);
    await build({
      configFile: path.join(sourceRoot, "vite.config.ts"),
      mode: "viewer",
      logLevel: "error",
      build: {
        outDir: outputRoot,
        emptyOutDir: true,
      },
    });

    return await fs.readFile(path.join(outputRoot, "dashboard.html"));
  } finally {
    await fs.rm(outputRoot, { recursive: true, force: true });
  }
};
