import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { createViewerViteConfiguration as createViewerViteConfig } from "@dashlet/shared-vite/viewer";

export const createViewerViteConfiguration = (
  projectRoot: string,
  dashboardPath = path.join(projectRoot, "dashboard", "dashboard.json"),
  generatedAssetsPath = path.join(projectRoot, ".pyodide-cache", "assets.ts"),
) =>
  createViewerViteConfig({
    clientRoot: path.join(projectRoot, "app/client"),
    dashboardPath,
    generatedAssetsPath,
    outputRoot: path.join(projectRoot, "dist"),
    viewerEntryPath: path.join(projectRoot, "app/client/src/app/ViewerApp.tsx"),
  });

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../");

export default defineConfig(() => createViewerViteConfiguration(projectRoot));
