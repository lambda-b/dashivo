import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { dashboardSchema } from "@dashivo/shared-schema/dashboard";
import { createFilesystemDashboardRepository } from "@dashivo/infra/local/persistence/filesystem-dashboard-repository";
import { createDashboardDefinitionService } from "@dashivo/server/services/dashboard-definition-service";
import { createPythonLogicService } from "@dashivo/server/services/python-logic-service";
import dashboardSource from "#dashboard/dashboard.json" with { type: "json" };

const createService = (projectRoot: string) => {
  const repository = createFilesystemDashboardRepository(projectRoot);
  const dashboardDefinitionService = createDashboardDefinitionService(repository);
  const pythonLogicService = createPythonLogicService(repository);

  return { repository, dashboardDefinitionService, pythonLogicService };
};

test("definition-only storage supports empty lists, ID collisions and registration rollback", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-definitions-"));
  const repository = createFilesystemDashboardRepository(root);

  try {
    expect(await repository.listDashboards()).toEqual([]);
    await expect(repository.readDashboard("sales-overview")).rejects.toThrow();

    const dashboard = dashboardSchema.parse(dashboardSource);
    const first = await repository.createDashboard("sales-overview", dashboard);
    const second = await repository.createDashboard("sales-overview", dashboard);
    expect([first.id, second.id]).toEqual(["sales-overview", "sales-overview-2"]);
    expect((await repository.listDashboards()).map((entry) => entry.id).sort()).toEqual([
      first.id,
      second.id,
    ]);

    const snapshot = await repository.readDashboard(first.id);
    const updated = { ...dashboard, title: "Updated" };
    await repository.writeDashboard(first.id, updated, snapshot.version);
    await expect(
      repository.writeDashboard(first.id, dashboard, snapshot.version),
    ).rejects.toThrow();
    await expect(
      repository.registerPythonLogicAtomically(first.id, {
        dashboard,
        expectedVersion: snapshot.version,
        logic: { id: "rollback", path: "logic/rollback.py", source: "pass" },
      }),
    ).rejects.toThrow();
    await expect(repository.readPython(first.id, "logic/rollback.py")).rejects.toThrow();
    expect((await repository.readDashboard(first.id)).dashboard).toEqual(updated);
  } finally {
    await fs.rm(root, { recursive: true });
  }
});

test("validates dashboard data in the application service", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-editor-"));
  await fs.mkdir(path.join(projectRoot, "dashboard/definitions"), { recursive: true });
  const { dashboardDefinitionService } = createService(projectRoot);

  try {
    await fs.writeFile(
      path.join(projectRoot, "dashboard/definitions/sales-overview.json"),
      `${JSON.stringify(dashboardSchema.parse(dashboardSource), null, 2)}\n`,
    );
    expect(await dashboardDefinitionService.read("sales-overview")).toEqual(
      dashboardSchema.parse(dashboardSource),
    );

    await fs.writeFile(
      path.join(projectRoot, "dashboard/definitions/sales-overview.json"),
      '{"title":"Invalid"}',
    );
    await expect(dashboardDefinitionService.read("sales-overview")).rejects.toThrow();
  } finally {
    await fs.rm(projectRoot, { recursive: true });
  }
});

test("updates the dashboard and registers logic through separate application services", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-scoped-"));
  await fs.mkdir(path.join(root, "dashboard/definitions"), { recursive: true });
  const { repository, dashboardDefinitionService, pythonLogicService } = createService(root);

  try {
    await fs.writeFile(
      path.join(root, "dashboard/definitions/sales-overview.json"),
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
      source: "from dashivo import plot\ndef execute(inputs, params): return plot.metric(1)\n",
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
