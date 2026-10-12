import fs from "node:fs/promises";
import path from "node:path";
import { createDashboardHtmlBuilder } from "@dashivo/server-exporter/build-dashboard";
import { dashboardSchema } from "@dashivo/shared-schema/dashboard";

const sample = JSON.parse(await fs.readFile("app/client/src/sample/dashboard.json", "utf8"));
const html = await createDashboardHtmlBuilder(path.resolve("."))({
  dashboardId: "sample",
  dashboard: dashboardSchema.parse(sample.dashboard),
  sources: await Promise.all(
    [
      ...new Set(
        [...sample.dashboard.analysis.inputs, ...sample.dashboard.analysis.logic].map(
          (item) => item.path,
        ),
      ),
    ].map(async (sourcePath) => ({
      path: sourcePath,
      source: await fs.readFile(path.join("app/client/src/sample", sourcePath), "utf8"),
    })),
  ),
});

await fs.writeFile(process.argv[2], new Uint8Array(html));
