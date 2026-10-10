import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createFilesystemDashboardRepository } from "@dashivo/infra/local/persistence/filesystem-dashboard-repository";
import { createEmptyDashboard } from "@dashivo/shared-schema/dashboard";

test("reads and writes Python only under dashboard/logic", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-assets-"));
  const repository = createFilesystemDashboardRepository(projectRoot);

  try {
    await fs.mkdir(path.join(projectRoot, "dashboard/sales-overview"), { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, "dashboard/sales-overview/dashboard.json"),
      '{"title":"Test"}',
    );
    const uploadedPath = await repository.createInput(
      "sales-overview",
      "orders.csv",
      "date,total\n2026-01-01,100\n",
    );

    expect(uploadedPath).toBe("data/orders.csv");
    await expect(repository.readInput("sales-overview", uploadedPath)).resolves.toContain("total");
    await expect(repository.listAssets("sales-overview")).resolves.toMatchObject({
      csv: [uploadedPath],
    });
    await expect(
      repository.readInput("sales-overview", "data/../../another-dashboard/data/orders.csv"),
    ).rejects.toThrow("dashboard/data");
    await expect(
      repository.createInput("sales-overview", "orders.csv", "duplicate"),
    ).rejects.toThrow("登録済み");

    await repository.createDashboard("other-dashboard", createEmptyDashboard("Other"));
    await repository.createInput("other-dashboard", "orders.csv", "value\n200\n");
    await repository.createPython("other-dashboard", "logic/private.py", "# private");
    expect(await repository.readInput("other-dashboard", uploadedPath)).toBe("value\n200\n");
    expect(await repository.readInput("sales-overview", uploadedPath)).toContain("total");
    await expect(repository.readPython("sales-overview", "logic/private.py")).rejects.toThrow(
      "ENOENT",
    );
    expect((await repository.listAssets("sales-overview")).python).not.toContain(
      "logic/private.py",
    );
    expect(
      await fs.readFile(
        path.join(projectRoot, "dashboard/other-dashboard/data/orders.csv"),
        "utf8",
      ),
    ).toBe("value\n200\n");
    await repository.writePython(
      "sales-overview",
      "logic/nested/example.py",
      "def execute(data, params):\n    return data\n",
    );
    await expect(
      repository.readPython("sales-overview", "logic/nested/example.py"),
    ).resolves.toContain("def execute");
    await repository.createPython(
      "sales-overview",
      "logic/new.py",
      "def execute(inputs, params):\n    return 0\n",
    );
    await expect(repository.readPython("sales-overview", "logic/new.py")).resolves.toContain(
      "return 0",
    );
    await expect(
      repository.createPython("sales-overview", "logic/new.py", "pass\n"),
    ).rejects.toThrow("EEXIST");
    await expect(
      repository.writePython("sales-overview", "../outside.py", "pass\n"),
    ).rejects.toThrow("dashboard/logic");
    await expect(
      repository.writePython("sales-overview", "logic/example.txt", "pass\n"),
    ).rejects.toThrow(".py file");
  } finally {
    await fs.rm(projectRoot, { recursive: true });
  }
});
