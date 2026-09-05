import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { loadPyodide, version as pyodideVersion } from "pyodide";

const root = process.cwd();
const pyodideRoot = path.join(root, "node_modules", "pyodide");
const cacheRoot = path.join(root, ".pyodide-cache");
const analysisSource = await fs.readFile(
  path.join(root, "dashboard", "logic", "analysis.py"),
  "utf8",
);

await fs.mkdir(cacheRoot, { recursive: true });

for (const file of ["pyodide.asm.wasm", "python_stdlib.zip"]) {
  await fs.copyFile(path.join(pyodideRoot, file), path.join(cacheRoot, file));
}

const pyodide = await loadPyodide({ packageCacheDir: cacheRoot });
const loadedPackages = await pyodide.loadPackagesFromImports(analysisSource, {
  messageCallback: () => {},
});
const packageFiles = loadedPackages.map((loadedPackage) => loadedPackage.fileName);

const files = ["pyodide.asm.wasm", "python_stdlib.zip", ...packageFiles];

await fs.writeFile(
  path.join(cacheRoot, "manifest.json"),
  `${JSON.stringify({ pyodideVersion, files }, null, 2)}\n`,
);

const embeddedAssets = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => [
      file,
      (await fs.readFile(path.join(cacheRoot, file))).toString("base64"),
    ]),
  ),
);
await fs.writeFile(
  path.join(cacheRoot, "assets.ts"),
  `export const embeddedAssets: Readonly<Record<string, string>> = ${JSON.stringify(embeddedAssets)};\n`,
);
await fs.rm(path.join(cacheRoot, "assets.json"), { force: true });
