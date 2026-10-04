import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createFilesystemDashboardRepository } from "@dashivo/infra/local/persistence/filesystem-dashboard-repository";

test("reads and writes Python only under dashboard/logic", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-assets-"));
  const repository = createFilesystemDashboardRepository(projectRoot);

  try {
    await fs.mkdir(path.join(projectRoot, "dashboard"));
    await fs.writeFile(path.join(projectRoot, "dashboard/dashboard.json"), '{"title":"Test"}');
    const uploadedPath = await repository.createInput(
      "sales-overview",
      "orders.csv",
      "date,total\n2026-01-01,100\n",
    );

    expect(uploadedPath).toBe("data/sales-overview/orders.csv");
    await expect(repository.readInput("sales-overview", uploadedPath)).resolves.toContain("total");
    await expect(repository.listAssets("sales-overview")).resolves.toMatchObject({
      csv: [uploadedPath],
    });
    await expect(
      repository.readInput("sales-overview", "data/another-dashboard/orders.csv"),
    ).rejects.toThrow("requested dashboard");
    await expect(
      repository.createInput("sales-overview", "orders.csv", "duplicate"),
    ).rejects.toThrow("登録済み");
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
