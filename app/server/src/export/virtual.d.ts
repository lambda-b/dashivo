declare module "pyodide/pyodide.asm.mjs" {
  const createPyodideModule: (settings: object) => unknown;
  export default createPyodideModule;
}
