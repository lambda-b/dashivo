import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { loadPyodide, version as pyodideVersion } from "pyodide";
import type { DashboardSchema } from "@dashlet/shared-schema/dashboard";

const pyodideWasmFile = "pyodide.asm.wasm";
const pythonStandardLibraryFile = "python_stdlib.zip";

export const preparePyodide = async (
  projectRoot: string,
  dashboardPath = path.join(projectRoot, "dashboard", "dashboard.json"),
  cacheRoot = path.join(projectRoot, ".pyodide-cache"),
) => {
  const pyodideRoot = path.dirname(fileURLToPath(import.meta.resolve("pyodide")));
  const dashboard: DashboardSchema = JSON.parse(await fs.readFile(dashboardPath, "utf8"));
  const analysisSources = await Promise.all(
    dashboard.analysis.logic.map(async (logic) => {
      const dashboardRoot = path.dirname(dashboardPath);
      const logicPath = path.resolve(dashboardRoot, logic.path);
      const relativePath = path.relative(dashboardRoot, logicPath);

      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new Error(`Dashboard logic must stay within dashboard/: ${logic.path}`);
      }

      return fs.readFile(logicPath, "utf8");
    }),
  );
  const sourceHash = createHash("sha256")
    .update(pyodideVersion)
    .update(analysisSources.join("\n"))
    .digest("hex");
  const currentManifest = await fs
    .readFile(path.join(cacheRoot, "manifest.json"), "utf8")
    .then((contents) => JSON.parse(contents) as { files?: string[]; sourceHash?: string })
    .catch(() => undefined);
  const cacheFiles = [...(currentManifest?.files ?? []), "assets.ts"];

  if (
    currentManifest?.sourceHash === sourceHash &&
    (
      await Promise.all(
        cacheFiles.map((file) =>
          fs.access(path.join(cacheRoot, file)).then(
            () => true,
            () => false,
          ),
        ),
      )
    ).every(Boolean)
  ) {
    return;
  }

  await fs.mkdir(cacheRoot, { recursive: true });

  for (const file of [pyodideWasmFile, pythonStandardLibraryFile]) {
    await fs.copyFile(path.join(pyodideRoot, file), path.join(cacheRoot, file));
  }

  const pyodide = await loadPyodide({ packageCacheDir: cacheRoot });
  const loadedPackages = await pyodide.loadPackagesFromImports(
    "import pandas as pd\n" + analysisSources.join("\n").replace(/^from dashlet import .*$/gm, ""),
    { messageCallback: () => {} },
  );
  const packageFiles = loadedPackages.map((loadedPackage) => loadedPackage.fileName);
  const pythonAssetFiles = [pythonStandardLibraryFile, ...packageFiles];
  const files = [pyodideWasmFile, ...pythonAssetFiles];

  await fs.writeFile(
    path.join(cacheRoot, "manifest.json"),
    `${JSON.stringify({ pyodideVersion, sourceHash, files }, null, 2)}\n`,
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
};

const scriptPath = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href;

if (scriptPath === import.meta.url) {
  await preparePyodide(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../../"),
  );
}
