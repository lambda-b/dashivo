import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { dashboardSchema } from "@dashivo/shared-schema/dashboard";
import { createFilesystemDashboardRepository } from "@dashivo/infra/local/persistence/filesystem-dashboard-repository";
import { createDashboardDefinitionService } from "@dashivo/server/services/dashboard-definition-service";
import { createPythonLogicService } from "@dashivo/server/services/python-logic-service";
import dashboardSource from "#dashboard/dashboard.json" with { type: "json" };
import sample from "@/sample/dashboard.json" with { type: "json" };
import { randomUUID } from "node:crypto";

test("trial registration atomically publishes all files and repeated revisions preserve server edits", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-registration-"));
  const { repository, dashboardDefinitionService, pythonLogicService } = createService(root);
  const registration = {
    revisionId: randomUUID(),
    dashboard: dashboardSchema.parse(sample.dashboard),
    sources: sample.sources,
  };

  try {
    const [first, retry] = await Promise.all([
      dashboardDefinitionService.register(registration),
      dashboardDefinitionService.register(registration),
    ]);
    expect(first.id).toBe(`draft-${registration.revisionId}`);
    expect(retry.id).toBe(first.id);
    expect(await repository.listDashboards()).toHaveLength(1);
    const collision = await repository.createDashboard(first.id, registration.dashboard);
    expect(collision.id).toBe(`${first.id}-2`);
    const imported = await dashboardDefinitionService.read(first.id);
    for (const input of imported.analysis.inputs) {
      const original = input.path.replace(`/${first.id}/`, "/");
      expect(await repository.readInput(first.id, input.path)).toBe(
        registration.sources[original as keyof typeof registration.sources],
      );
    }
    for (const logic of imported.analysis.logic) {
      const original = logic.path.replace(`/${first.id}/`, "/");
      expect(await repository.readPython(first.id, logic.path)).toBe(
        registration.sources[original as keyof typeof registration.sources],
      );
    }
    const { analysis: _, ...settings } = imported;
    await dashboardDefinitionService.update(first.id, {
      settings: { ...settings, title: "Server edit" },
    });
    await pythonLogicService.create(first.id, {
      id: "extra",
      path: `logic/${first.id}/extra.py`,
      source: "# new logic",
    });
    const sourcePath = imported.analysis.logic[0].path;
    await repository.writePython(first.id, sourcePath, "# server edit");
    await repository.createInput(first.id, "extra.csv", "value\n1\n");
    expect((await repository.listAssets(first.id)).csv).toContain(`data/${first.id}/extra.csv`);
    expect((await dashboardDefinitionService.register(registration)).title).toBe("Server edit");
    expect(await repository.readPython(first.id, sourcePath)).toBe("# server edit");
    expect((await dashboardDefinitionService.read(first.id)).analysis.logic.at(-1)?.id).toBe(
      "extra",
    );
    const changed = await dashboardDefinitionService.register({
      ...registration,
      revisionId: randomUUID(),
    });
    expect(changed.id).not.toBe(first.id);
    expect(await repository.listDashboards()).toHaveLength(3);
    await expect(
      dashboardDefinitionService.register({
        ...registration,
        revisionId: randomUUID(),
        sources: {},
      }),
    ).rejects.toThrow();
    expect(await repository.listDashboards()).toHaveLength(3);
    expect(
      (await fs.readdir(path.join(root, "dashboard/registrations"))).some((name) =>
        name.startsWith(".pending-"),
      ),
    ).toBe(false);
  } finally {
    await fs.rm(root, { recursive: true });
  }
});

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
