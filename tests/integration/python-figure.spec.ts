import fs from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { loadPyodide } from "pyodide";

test("Python figures serialize data, dates, missing values and formatting", async () => {
  const python = await loadPyodide({
    indexURL: path.resolve("node_modules/pyodide"),
    packageCacheDir: path.resolve(".pyodide-cache"),
  });
  await python.loadPackage("pandas");
  python.FS.writeFile(
    "/home/pyodide/dashlet.py",
    await fs.readFile("app/client/src/ports/workers/python/dashlet.py", "utf8"),
  );
  const source = `
from dashlet import plot, serialize
import pandas as pd
data = pd.DataFrame({"date": [pd.Timestamp("2026-01-01"), pd.NaT], "revenue": [10.0, float("nan")]})
fig = plot.line(data, x="date", y="revenue").title("Revenue")
fig.y_axis(format="currency", minimum=0).colors("#ca2420").legend(visible=False)
serialize(fig)
`;
  const result = JSON.parse(python.runPython(source));
  expect(result.data).toEqual([
    { date: "2026-01-01T00:00:00", revenue: 10 },
    { date: null, revenue: null },
  ]);
  expect(result.view.formatting.yAxis.minimum).toBe(0);
  expect(result.view.title).toBe("Revenue");
  expect(() => python.runPython("serialize(42)")).toThrow("must return a dashlet Figure");
  expect(() => python.runPython('serialize(plot.metric(float("inf")))')).toThrow();
  expect(
    JSON.parse(
      python.runPython(
        'serialize(plot.table(data).column("revenue", label="売上", format="currency"))',
      ),
    ).view.columns[1].label,
  ).toBe("売上");
});
