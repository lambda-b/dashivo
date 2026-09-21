import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export const dashboardOutput = (): Plugin => {
  let outDir = "";

  return {
    name: "dashlet-dashboard-output",
    apply: "build",
    configResolved: (config) => {
      outDir = config.build.outDir;
    },
    closeBundle: () => {
      fs.renameSync(path.join(outDir, "index.html"), path.join(outDir, "dashboard.html"));
    },
  };
};
