import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { loadPyodide } from "pyodide";
import { analysisOutputSchema, dashboardSchema } from "@dashivo/shared-schema/dashboard";

test("daily login sample applies platform and date parameters to every output", async () => {
  const root = path.resolve("dashboard/daily-login");
  const dashboard = dashboardSchema.parse(
    JSON.parse(await fs.readFile(path.join(root, "dashboard.json"), "utf8")),
  );
  const python = await loadPyodide({
    indexURL: path.dirname(fileURLToPath(import.meta.resolve("pyodide"))),
    packageCacheDir: path.resolve(".pyodide-cache"),
  });
  await python.loadPackage("pandas");
  python.FS.writeFile(
    "/home/pyodide/dashivo.py",
    await fs.readFile("app/client/src/ports/workers/python/dashivo.py", "utf8"),
  );
  python.globals.set(
    "csv_source",
    await fs.readFile(path.join(root, dashboard.analysis.inputs[0].path), "utf8"),
  );
  python.runPython(
    "from dashivo import serialize\nimport pandas as pd, io\nframe = pd.read_csv(io.StringIO(csv_source))",
  );

  const cases = [
    { params: {}, successful: 2785, failed: 139, days: 10 },
    { params: { platform: "web" }, successful: 1540, failed: 79, days: 10 },
    {
      params: { platform: "mobile", login_period: { from: "2026-10-08", to: "2026-10-08" } },
      successful: 145,
      failed: 16,
      days: 1,
    },
    {
      params: { login_period: { from: "2027-01-01", to: "2027-01-31" } },
      successful: 0,
      failed: 0,
      days: 0,
    },
  ];

  for (const { params, successful, failed, days } of cases) {
    using pythonParams = python.toPy(params);
    python.globals.set("params", pythonParams);
    for (const logic of dashboard.analysis.logic) {
      python.globals.set("source", await fs.readFile(path.join(root, logic.path), "utf8"));
      const output = analysisOutputSchema.parse(
        JSON.parse(
          python.runPython(`
namespace = {}
exec(source, namespace)
serialize(namespace["execute"]({"logins": frame.copy(deep=True)}, params))
`),
        ),
      );
      if (logic.id === "total-logins") expect(output.data).toBe(successful);
      else if (logic.id === "failed-logins") expect(output.data).toBe(failed);
      else {
        expect(Array.isArray(output.data)).toBe(true);
        if (!Array.isArray(output.data)) throw new Error("Expected rows");
        if (logic.id === "platform-share") {
          expect(output.data.reduce((sum, row) => sum + Number(row.logins), 0)).toBe(successful);
        } else {
          expect(output.data).toHaveLength(days);
          expect(output.data.reduce((sum, row) => sum + Number(row.successful_logins), 0)).toBe(
            successful,
          );
          expect(output.data.reduce((sum, row) => sum + Number(row.failed_logins), 0)).toBe(failed);
          if (logic.id === "daily-table") {
            for (const row of output.data)
              expect(row.failure_rate).toBeCloseTo(
                (100 * Number(row.failed_logins)) /
                  (Number(row.successful_logins) + Number(row.failed_logins)),
                2,
              );
          }
        }
      }
    }
  }
});
