import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

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

const manifest = JSON.parse(
  fs.readFileSync(path.resolve(".pyodide-cache", "manifest.json"), "utf8"),
);
for (const file of manifest.files) {
  const contents = fs.readFileSync(path.resolve(".pyodide-cache", file));
  if (html.includes(contents.toString("base64"))) {
    throw new Error(`Uncompressed Pyodide asset remains in the standalone HTML: ${file}`);
  }

  const compressed = gzipSync(contents, { level: 9 }).toString("base64");
  const copies = html.split(compressed).length - 1;
  if (copies !== 1) {
    throw new Error(`Expected one compressed copy of ${file}, found ${copies}.`);
  }
}

for (const marker of ["Builderを開く", "DEVELOPMENT ONLY", "Dashboard Builder", "/api/dashboard"]) {
  if (html.includes(marker)) {
    throw new Error(`Development-only marker found: ${marker}`);
  }
}

process.stdout.write(`Verified standalone ${files[0]} (${Buffer.byteLength(html)} bytes).\n`);
