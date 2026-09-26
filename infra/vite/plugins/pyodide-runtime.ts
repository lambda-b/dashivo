import path from "node:path";
import type { ConfigEnv, Plugin } from "vite";

export const pyodideRuntimeModuleId = "virtual:dashlet/pyodide-runtime";
const resolvedModuleId = `\0${pyodideRuntimeModuleId}`;

export const pyodideRuntime = (projectRoot: string, command: ConfigEnv["command"]): Plugin => {
  const implementationPath = path.join(
    projectRoot,
    "infra",
    "vite",
    "virtual",
    "dashlet",
    command === "serve" ? "pyodide-runtime.ts" : "pyodide-runtime.build.ts",
  );

  return {
    name: "dashlet-pyodide-runtime",
    enforce: "pre",
    resolveId: (id) => (id === pyodideRuntimeModuleId ? resolvedModuleId : undefined),
    load: (id) =>
      id === resolvedModuleId
        ? `export { initializePyodide } from ${JSON.stringify(implementationPath)};`
        : undefined,
    transform(code, id) {
      if (command !== "build" || !id.endsWith("/pyodide/pyodide.asm.mjs")) return undefined;

      const bundledWasmReference = 'new URL("pyodide.asm.wasm",import.meta.url).href';
      return code.replace(bundledWasmReference, 'locateFile("pyodide.asm.wasm")');
    },
  };
};
