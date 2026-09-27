import type { Plugin } from "vite";

export const pyodideWasm = (): Plugin => ({
  name: "dashlet-pyodide-wasm",
  transform(code, id) {
    if (!id.endsWith("/pyodide/pyodide.asm.mjs")) return undefined;

    const bundledWasmReference = 'new URL("pyodide.asm.wasm",import.meta.url).href';
    return code.replace(bundledWasmReference, 'locateFile("pyodide.asm.wasm")');
  },
});
