import fs from "node:fs/promises";
import type { Plugin } from "vite";

const sourceId = "#dashboard/dashboard.json";
const virtualId = "\0virtual:dashlet/dashboard-definition";

export const dashboardDefinition = (dashboardPath: string): Plugin => ({
  name: "dashlet-dashboard-definition",
  enforce: "pre",
  resolveId: (id) => (id === sourceId ? virtualId : undefined),
  async load(id) {
    if (id !== virtualId) return undefined;
    return `export default ${await fs.readFile(dashboardPath, "utf8")};`;
  },
});
