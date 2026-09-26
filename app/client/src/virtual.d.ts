declare module "virtual:dashlet/analysis-assets" {
  export const analysisDefinitions: {
    id: string;
    inputs: { id: string; sourceData: string }[];
    path: string;
    analysisSource: string;
  }[];
}

declare module "virtual:dashlet/app-target" {
  export const appTarget: "editor" | "viewer";
}

declare module "virtual:dashlet/pyodide-runtime" {
  import type { PyodideAPI } from "pyodide";

  export const initializePyodide: () => Promise<PyodideAPI>;
}
