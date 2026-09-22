import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  createPythonSource,
  readPythonSource,
  writePythonSource,
} from "@vite/server/filesystem-dashboard-repository";

test("reads and writes Python only under dashboard/logic", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-assets-"));

  try {
    await writePythonSource(
      projectRoot,
      "logic/nested/example.py",
      "def execute(data, params):\n    return data\n",
    );
    await expect(readPythonSource(projectRoot, "logic/nested/example.py")).resolves.toContain(
      "def execute",
    );
    await createPythonSource(
      projectRoot,
      "logic/new.py",
      "def execute(inputs, params):\n    return 0\n",
    );
    await expect(readPythonSource(projectRoot, "logic/new.py")).resolves.toContain("return 0");
    await expect(createPythonSource(projectRoot, "logic/new.py", "pass\n")).rejects.toThrow(
      "EEXIST",
    );
    await expect(writePythonSource(projectRoot, "../outside.py", "pass\n")).rejects.toThrow(
      "dashboard/logic",
    );
    await expect(writePythonSource(projectRoot, "logic/example.txt", "pass\n")).rejects.toThrow(
      ".py file",
    );
  } finally {
    await fs.rm(projectRoot, { recursive: true });
  }
});
