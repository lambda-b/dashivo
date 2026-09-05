import { loadPyodide, type PyodideAPI } from "pyodide";

const developmentAssetUrl = new URL("/pyodide/", globalThis.location.href).href;

export const initializePyodide = (): Promise<PyodideAPI> =>
  loadPyodide({
    indexURL: developmentAssetUrl,
    packageBaseUrl: developmentAssetUrl,
  });
