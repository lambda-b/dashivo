import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { dashboardSchema } from "@/schema/dashboard";
import { writeDashboardFile, updateDashboardFile } from "@vite/plugins/dashboard-editor";
import dashboardSource from "#dashboard/dashboard.json" with { type: "json" };

test("validates and writes dashboard.json", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-editor-"));
  await fs.mkdir(path.join(projectRoot, "dashboard"));

  try {
    await writeDashboardFile(projectRoot, dashboardSource);
    const saved = JSON.parse(
      await fs.readFile(path.join(projectRoot, "dashboard", "dashboard.json"), "utf8"),
    );
    expect(saved).toEqual(dashboardSchema.parse(dashboardSource));
    await expect(writeDashboardFile(projectRoot, { title: "Invalid" })).rejects.toThrow();
  } finally {
    await fs.rm(projectRoot, { recursive: true });
  }
});

test("serializes scoped saves and creates logic without overwriting files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-scoped-"));
  await fs.mkdir(path.join(root, "dashboard"));
  try {
    await writeDashboardFile(root, dashboardSource);
    const { analysis, ...settings } = dashboardSchema.parse(dashboardSource);
    await Promise.all([
      updateDashboardFile(root, { settings: { ...settings, title: "Saved settings" } }),
      updateDashboardFile(root, {
        analysis: {
          ...analysis,
          inputs: [...analysis.inputs, { id: "extra", type: "csv", path: "data/raw/sales.csv" }],
        },
      }),
    ]);
    const created = await updateDashboardFile(root, {
      logic: {
        id: "new-logic",
        path: "logic/new-logic.py",
        source: "from dashlet import plot\ndef execute(inputs, params): return plot.metric(1)\n",
      },
    });
    expect(created.title).toBe("Saved settings");
    expect(created.analysis.inputs).toHaveLength(2);
    expect(created.analysis.logic.at(-1)?.id).toBe("new-logic");
    const code = await fs.readFile(path.join(root, "dashboard/logic/new-logic.py"), "utf8");
    await expect(
      updateDashboardFile(root, {
        logic: { id: "new-logic", path: "logic/new-logic.py", source: "pass" },
      }),
    ).rejects.toThrow();
    expect(await fs.readFile(path.join(root, "dashboard/logic/new-logic.py"), "utf8")).toBe(code);
  } finally {
    await fs.rm(root, { recursive: true });
  }
});
