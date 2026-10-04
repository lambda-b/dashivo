import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export const dashboardOutput = (): Plugin => {
  return {
    name: "dashivo-dashboard-output",
    apply: "build",
    transformIndexHtml: {
      order: "pre",
      handler: (html, { filename }) => {
        const icon = fs.readFileSync(path.join(path.dirname(filename), "public", "favicon.svg"));
        return html.replace(
          'href="/favicon.svg"',
          `href="data:image/svg+xml;base64,${icon.toString("base64")}"`,
        );
      },
    },
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
