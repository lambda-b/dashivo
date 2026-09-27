import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createFilesystemDashboardRepository } from "@dashlet/infra/local/persistence/filesystem-dashboard-repository";

test("reads and writes Python only under dashboard/logic", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-assets-"));
  const repository = createFilesystemDashboardRepository(projectRoot);

  try {
    await fs.mkdir(path.join(projectRoot, "dashboard"));
    await fs.writeFile(path.join(projectRoot, "dashboard/dashboard.json"), '{"title":"Test"}');
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
