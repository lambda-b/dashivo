import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";
import { loadPyodide, version as pyodideVersion } from "pyodide";

import type { DashboardSchema } from "../../src/schema/dashboard.ts";

const root = process.cwd();
const pyodideRoot = path.join(root, "node_modules", "pyodide");
const cacheRoot = path.join(root, ".pyodide-cache");
const dashboardRoot = path.join(root, "dashboard");
const pyodideWasmFile = "pyodide.asm.wasm";
const pythonStandardLibraryFile = "python_stdlib.zip";
const dashboard: DashboardSchema = JSON.parse(
  await fs.readFile(path.join(dashboardRoot, "dashboard.json"), "utf8"),
);
const analysisSources = await Promise.all(
  dashboard.analysis.logic.map(async (logic) => {
    const logicPath = path.resolve(dashboardRoot, logic.path);
    const relativePath = path.relative(dashboardRoot, logicPath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error(`Dashboard logic must stay within dashboard/: ${logic.path}`);
    }
    return fs.readFile(logicPath, "utf8");
  }),
);

await fs.mkdir(cacheRoot, { recursive: true });

for (const file of [pyodideWasmFile, pythonStandardLibraryFile]) {
  await fs.copyFile(path.join(pyodideRoot, file), path.join(cacheRoot, file));
}

const pyodide = await loadPyodide({ packageCacheDir: cacheRoot });
const loadedPackages = await pyodide.loadPackagesFromImports(
  "import pandas as pd\n" + analysisSources.join("\n").replace(/^from dashlet import .*$/gm, ""),
  {
    messageCallback: () => {},
  },
);
const packageFiles = loadedPackages.map((loadedPackage) => loadedPackage.fileName);

const pythonAssetFiles = [pythonStandardLibraryFile, ...packageFiles];
const files = [pyodideWasmFile, ...pythonAssetFiles];

await fs.writeFile(
  path.join(cacheRoot, "manifest.json"),
  `${JSON.stringify({ pyodideVersion, files }, null, 2)}\n`,
);

const compressAsset = async (file: string) =>
  gzipSync(await fs.readFile(path.join(cacheRoot, file)), { level: 9 }).toString("base64");
const compressedPyodideWasm = await compressAsset(pyodideWasmFile);
const compressedPythonAssets = Object.fromEntries(
  await Promise.all(pythonAssetFiles.map(async (file) => [file, await compressAsset(file)])),
);
await fs.writeFile(
  path.join(cacheRoot, "assets.ts"),
  [
    `export const compressedPyodideWasm = ${JSON.stringify(compressedPyodideWasm)};`,
    `export const compressedPythonAssets: Readonly<Record<string, string>> = ${JSON.stringify(compressedPythonAssets)};`,
    "",
  ].join("\n"),
);
