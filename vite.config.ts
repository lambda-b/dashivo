import fs from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const virtualAssetsId = "virtual:dashlet-assets";
const resolvedVirtualAssetsId = `\0${virtualAssetsId}`;
const emptyNodeModuleId = "\0dashlet-empty-node-module";
const nodeBuiltins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

function dashletAssets(): Plugin {
  return {
    name: "dashlet-embedded-pyodide-assets",
    resolveId(id) {
      return id === virtualAssetsId ? resolvedVirtualAssetsId : undefined;
    },
    load(id) {
      if (id !== resolvedVirtualAssetsId) return undefined;

      const manifestPath = path.join(projectRoot, ".pyodide-cache", "manifest.json");
      if (!fs.existsSync(manifestPath)) {
        throw new Error("Pyodide assets are missing. Run `npm run prepare:pyodide` first.");
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        files: string[];
      };
      const assets = Object.fromEntries(
        manifest.files.map((file) => [
          file,
          fs.readFileSync(path.join(projectRoot, ".pyodide-cache", file)).toString("base64"),
        ]),
      );

      return `export const assets = ${JSON.stringify(assets)};`;
    },
  };
}

function browserOnlyWorker(): Plugin {
  return {
    name: "dashlet-browser-only-worker",
    enforce: "pre",
    resolveId(id) {
      return nodeBuiltins.has(id) ? emptyNodeModuleId : undefined;
    },
    load(id) {
      return id === emptyNodeModuleId ? "export default {};" : undefined;
    },
  };
}

export default defineConfig({
  plugins: [dashletAssets(), react(), viteSingleFile()],
  server: {
    host: "0.0.0.0",
    port: 3030,
    strictPort: true,
  },
  worker: {
    format: "iife",
    plugins: () => [dashletAssets(), browserOnlyWorker()],
    rollupOptions: {
      output: {
        banner: "globalThis.importScripts = undefined;",
        inlineDynamicImports: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    assetsInlineLimit: Number.POSITIVE_INFINITY,
    chunkSizeWarningLimit: 100_000,
    rollupOptions: {
      input: path.join(projectRoot, "dashboard.html"),
      output: {
        entryFileNames: "dashboard.js",
        assetFileNames: "dashboard.[ext]",
      },
    },
  },
});
