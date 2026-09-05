import fs from "node:fs";
import path from "node:path";

const outputDirectory = path.resolve("dist");
const files = fs.readdirSync(outputDirectory);
if (files.length !== 1 || files[0] !== "dashboard.html") {
  throw new Error(`Unexpected dist contents: ${files.join(", ")}`);
}

const html = fs.readFileSync(path.join(outputDirectory, files[0]), "utf8");
const externalReferences = [/<script[^>]+src=/i, /<link[^>]+href=/i, /@import\s+url/i];
for (const pattern of externalReferences) {
  if (pattern.test(html)) {
    throw new Error(`External asset reference remains: ${pattern}`);
  }
}

for (const marker of ["numpy-2.4.6", "pandas-3.0.2", "python_stdlib.zip", "pyodide.asm.wasm"]) {
  if (!html.includes(marker)) {
    throw new Error(`Embedded asset marker missing: ${marker}`);
  }
}

for (const marker of [
  "Builderを開く",
  "DEVELOPMENT ONLY",
  "Dashboard Builder",
  "/__dashlet/dashboard",
]) {
  if (html.includes(marker)) {
    throw new Error(`Development-only marker found: ${marker}`);
  }
}

process.stdout.write(`Verified standalone ${files[0]} (${html.length} bytes).\n`);
