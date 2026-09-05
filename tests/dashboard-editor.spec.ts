import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { writeDashboardFile } from "@vite/plugins/dashboard-editor";
import dashboardSource from "#dashboard/dashboard.json" with { type: "json" };

test("validates and writes dashboard.json", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-editor-"));
  await fs.mkdir(path.join(projectRoot, "dashboard"));

  try {
    await writeDashboardFile(projectRoot, dashboardSource);
    const saved = JSON.parse(
      await fs.readFile(path.join(projectRoot, "dashboard", "dashboard.json"), "utf8"),
    );
    expect(saved).toEqual(dashboardSource);
    await expect(writeDashboardFile(projectRoot, { title: "Invalid" })).rejects.toThrow();
  } finally {
    await fs.rm(projectRoot, { recursive: true });
  }
});
