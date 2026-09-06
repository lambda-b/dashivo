import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { readPythonSource, writePythonSource } from "@vite/plugins/dashboard-assets";

test("reads and writes Python only under dashboard/logic", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "dashlet-assets-"));

  try {
    await writePythonSource(
      projectRoot,
      "logic/nested/example.py",
      "def execute(params):\n    return params\n",
    );
    await expect(readPythonSource(projectRoot, "logic/nested/example.py")).resolves.toContain(
      "def execute",
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
