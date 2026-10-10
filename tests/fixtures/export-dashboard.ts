import fs from "node:fs/promises";
import path from "node:path";
import { createDashboardHtmlBuilder } from "@dashivo/server-exporter/build-dashboard";
import { dashboardSchema } from "@dashivo/shared-schema/dashboard";

const sample = JSON.parse(await fs.readFile("app/client/src/sample/dashboard.json", "utf8"));
const html = await createDashboardHtmlBuilder(path.resolve("."))({
  dashboardId: "sample",
  dashboard: dashboardSchema.parse(sample.dashboard),
  sources: Object.entries(sample.sources as Record<string, string>).map(([path, source]) => ({
    path,
    source,
  })),
});

await fs.writeFile(process.argv[2], new Uint8Array(html));
