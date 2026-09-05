import path from "node:path";
import type { ConfigEnv, Plugin } from "vite";

export const pyodideRuntimeModuleId = "virtual:dashlet/pyodide-runtime";
const resolvedModuleId = `\0${pyodideRuntimeModuleId}`;

export const pyodideRuntime = (projectRoot: string, command: ConfigEnv["command"]): Plugin => {
  const implementationPath = path.join(
    projectRoot,
    "vite",
    "virtual",
    "pyodide-runtime",
    command === "serve" ? "development.ts" : "embedded.ts",
  );

  return {
    name: "dashlet-pyodide-runtime",
    enforce: "pre",
    resolveId: (id) => (id === pyodideRuntimeModuleId ? resolvedModuleId : undefined),
    load: (id) =>
      id === resolvedModuleId
        ? `export { initializePyodide } from ${JSON.stringify(implementationPath)};`
        : undefined,
  };
};
