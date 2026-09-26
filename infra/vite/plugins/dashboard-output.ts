import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export const dashboardOutput = (): Plugin => {
  return {
    name: "dashlet-dashboard-output",
    apply: "build",
    writeBundle: (options) => {
      const outDir = options.dir ?? "";
      const indexPath = path.join(outDir, "index.html");
      const dashboardPath = path.join(outDir, "dashboard.html");

      if (fs.existsSync(indexPath)) fs.renameSync(indexPath, dashboardPath);
      else if (!fs.existsSync(dashboardPath))
        throw new Error("Vite did not emit an HTML dashboard.");
    },
  };
};
