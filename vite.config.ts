import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { browserOnlyWorker } from "./vite/plugins/browser-only-worker.ts";
import { dashboardOutput } from "./vite/plugins/dashboard-output.ts";
import { pyodideAssets } from "./vite/plugins/pyodide-assets.ts";
import { pyodideRuntime } from "./vite/plugins/pyodide-runtime.ts";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    pyodideRuntime(projectRoot, command),
    pyodideAssets(projectRoot),
    viteSingleFile(),
    dashboardOutput(projectRoot),
  ],
  server: {
    host: "0.0.0.0",
    port: 3030,
    strictPort: true,
  },
  worker: {
    format: "iife",
    plugins: () => [browserOnlyWorker(), pyodideRuntime(projectRoot, command)],
    rollupOptions: {
      output: {
        banner: "globalThis.importScripts = undefined;",
        codeSplitting: false,
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
      output: {
        entryFileNames: "dashboard.js",
        assetFileNames: "dashboard.[ext]",
      },
    },
  },
}));
