import { loadPyodide, type PyodideAPI } from "pyodide";

const assetUrl = new URL("/pyodide/", globalThis.location.origin).href;

export const initializePyodide = (): Promise<PyodideAPI> =>
  loadPyodide({
    indexURL: assetUrl,
    packageBaseUrl: assetUrl,
  });
