import type { Plugin } from "vite";
import type { AppTarget } from "../virtual/dashlet/app-target.ts";

const moduleId = "virtual:dashlet/app-target";
const resolvedModuleId = `\0${moduleId}`;

export const appTarget = (target: AppTarget): Plugin => ({
  name: "dashlet-app-target",
  enforce: "pre",
  resolveId: (id) => (id === moduleId ? resolvedModuleId : undefined),
  load: (id) =>
    id === resolvedModuleId ? `export const appTarget = ${JSON.stringify(target)};` : undefined,
});
