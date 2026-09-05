import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export const dashboardOutput = (projectRoot: string): Plugin => ({
  name: "dashlet-dashboard-output",
  closeBundle: () => {
    const indexPath = path.join(projectRoot, "dist", "index.html");
    const dashboardPath = path.join(projectRoot, "dist", "dashboard.html");
    if (fs.existsSync(indexPath)) fs.renameSync(indexPath, dashboardPath);
  },
});
