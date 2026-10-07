import type { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export const createDashboardViteConfiguration = (
  clientRoot: string,
  pyodideRuntimePath: string,
): UserConfig => ({
  root: clientRoot,
  resolve: {
    tsconfigPaths: true,
    alias: {
      "virtual:dashivo/pyodide-runtime": pyodideRuntimePath,
    },
  },
  plugins: [react(), tailwindcss()],
  worker: {
    format: "iife",
    rollupOptions: {
      output: { banner: "globalThis.importScripts = undefined;", codeSplitting: false },
    },
  },
});
