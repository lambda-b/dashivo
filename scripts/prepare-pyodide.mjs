import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const pyodideRoot = path.join(root, "node_modules", "pyodide");
const cacheRoot = path.join(root, ".pyodide-cache");
const packageJson = JSON.parse(await fs.readFile(path.join(pyodideRoot, "package.json"), "utf8"));
const lock = JSON.parse(await fs.readFile(path.join(pyodideRoot, "pyodide-lock.json"), "utf8"));
const requestedPackages = ["numpy", "pandas"];
const packageNames = new Set();

const collectPackage = (name) => {
  if (packageNames.has(name)) return;
  const entry = lock.packages[name];
  if (!entry) throw new Error(`Pyodide package not found in lockfile: ${name}`);
  packageNames.add(name);
  for (const dependency of entry.depends ?? []) collectPackage(dependency);
};

for (const name of requestedPackages) collectPackage(name);

await fs.mkdir(cacheRoot, { recursive: true });

for (const file of ["pyodide.asm.wasm", "python_stdlib.zip"]) {
  await fs.copyFile(path.join(pyodideRoot, file), path.join(cacheRoot, file));
}

for (const name of packageNames) {
  const entry = lock.packages[name];
  const destination = path.join(cacheRoot, entry.file_name);
  let bytes;

  try {
    bytes = await fs.readFile(destination);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const url = `https://cdn.jsdelivr.net/pyodide/v${packageJson.version}/full/${entry.file_name}`;
    process.stdout.write(`Downloading ${entry.file_name}\n`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    bytes = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(destination, bytes);
  }

  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== entry.sha256) {
    await fs.rm(destination, { force: true });
    throw new Error(`Checksum mismatch for ${entry.file_name}`);
  }
}

const files = [
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  ...[...packageNames].map((name) => lock.packages[name].file_name),
];

await fs.writeFile(
  path.join(cacheRoot, "manifest.json"),
  `${JSON.stringify({ pyodideVersion: packageJson.version, files }, null, 2)}\n`,
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
