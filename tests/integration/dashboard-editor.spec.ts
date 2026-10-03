import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { dashboardSchema } from "@dashlet/shared-schema/dashboard";
import { createFilesystemDashboardRepository } from "@dashlet/infra/local/persistence/filesystem-dashboard-repository";
import { createDashboardDefinitionService } from "@dashlet/server/services/dashboard-definition-service";
import { createPythonLogicService } from "@dashlet/server/services/python-logic-service";
import dashboardSource from "#dashboard/dashboard.json" with { type: "json" };

const createService = (projectRoot: string) => {
  const repository = createFilesystemDashboardRepository(projectRoot);
  const dashboardDefinitionService = createDashboardDefinitionService(repository);
  const pythonLogicService = createPythonLogicService(repository);

  return { repository, dashboardDefinitionService, pythonLogicService };
};

test("validates dashboard data in the application service", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-editor-"));
  await fs.mkdir(path.join(projectRoot, "dashboard"));
  const { dashboardDefinitionService } = createService(projectRoot);

  try {
    await fs.writeFile(
      path.join(projectRoot, "dashboard/dashboard.json"),
      `${JSON.stringify(dashboardSchema.parse(dashboardSource), null, 2)}\n`,
    );
    expect(await dashboardDefinitionService.read("sales-overview")).toEqual(
      dashboardSchema.parse(dashboardSource),
    );

    await fs.writeFile(path.join(projectRoot, "dashboard/dashboard.json"), '{"title":"Invalid"}');
    await expect(dashboardDefinitionService.read("sales-overview")).rejects.toThrow();
  } finally {
    await fs.rm(projectRoot, { recursive: true });
  }
});

test("updates the dashboard and registers logic through separate application services", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-scoped-"));
  await fs.mkdir(path.join(root, "dashboard"));
  const { repository, dashboardDefinitionService, pythonLogicService } = createService(root);

  try {
    await fs.writeFile(
      path.join(root, "dashboard/dashboard.json"),
      `${JSON.stringify(dashboardSchema.parse(dashboardSource), null, 2)}\n`,
    );
    const { analysis, ...settings } = dashboardSchema.parse(dashboardSource);

    await dashboardDefinitionService.update("sales-overview", {
      settings: { ...settings, title: "Saved settings" },
    });
    await dashboardDefinitionService.update("sales-overview", {
      analysis: {
        ...analysis,
        inputs: [
          ...analysis.inputs,
          { id: "extra", type: "csv", path: "data/sales-overview/raw/sales.csv" },
        ],
      },
    });

    const created = await pythonLogicService.create("sales-overview", {
      id: "new-logic",
      path: "logic/new-logic.py",
      source: "from dashlet import plot\ndef execute(inputs, params): return plot.metric(1)\n",
    });

    expect(created.title).toBe("Saved settings");
    expect(created.analysis.inputs).toHaveLength(2);
    expect(created.analysis.logic.at(-1)?.id).toBe("new-logic");

    const code = await repository.readPython("sales-overview", "logic/new-logic.py");
    await expect(
      pythonLogicService.create("sales-overview", {
        id: "new-logic",
        path: "logic/new-logic.py",
        source: "pass",
      }),
    ).rejects.toThrow();
    expect(await repository.readPython("sales-overview", "logic/new-logic.py")).toBe(code);
  } finally {
    await fs.rm(root, { recursive: true });
  }
});
