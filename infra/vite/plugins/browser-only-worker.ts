import { builtinModules } from "node:module";
import type { Plugin } from "vite";

const emptyNodeModuleId = "\0dashlet-empty-node-module";
const nodeBuiltins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

export const browserOnlyWorker = (): Plugin => ({
  name: "dashlet-browser-only-worker",
  enforce: "pre",
  resolveId: (id) => (nodeBuiltins.has(id) ? emptyNodeModuleId : undefined),
  load: (id) => (id === emptyNodeModuleId ? "export default {};" : undefined),
});
