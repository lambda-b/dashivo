import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { loadPyodide } from "pyodide";
import { analysisOutputSchema } from "@dashivo/shared-schema/dashboard";

test("Python figures serialize data, dates, missing values and formatting", async () => {
  const python = await loadPyodide({
    indexURL: path.dirname(fileURLToPath(import.meta.resolve("pyodide"))),
    packageCacheDir: path.resolve(".pyodide-cache"),
  });
  await python.loadPackage("pandas");
  python.FS.writeFile(
    "/home/pyodide/dashivo.py",
    await fs.readFile("app/client/src/ports/workers/python/dashivo.py", "utf8"),
  );
  const source = `
from dashivo import plot, serialize
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
  expect(() => python.runPython("serialize(42)")).toThrow("must return a dashivo Figure");
  expect(() => python.runPython('serialize(plot.metric(float("inf")))')).toThrow();
  expect(
    JSON.parse(
      python.runPython(
        'serialize(plot.table(data).column("revenue", label="売上", format="currency"))',
      ),
    ).view.columns[1].label,
  ).toBe("売上");

  const metric = analysisOutputSchema.parse(
    JSON.parse(
      python.runPython(`
serialize(plot.metric({"Revenue": 100, "Previous": 95}, columns=2, format="currency", emphasis="strong").title("Summary"))
`),
    ),
  );
  expect(metric.data).toEqual([
    { label: "Revenue", value: 100 },
    { label: "Previous", value: 95 },
  ]);
  expect(metric.view).toMatchObject({
    type: "metric",
    columns: 2,
    format: "currency",
    emphasis: "strong",
  });
  expect(
    analysisOutputSchema.safeParse({ ...metric, data: [{ label: "Bad", value: "100" }] }).success,
  ).toBe(false);
  const single = analysisOutputSchema.parse(
    JSON.parse(python.runPython('serialize(plot.metric(42).title("Orders"))')),
  );
  expect(single.data).toEqual([{ label: "", value: 42 }]);
  expect(single.view).toMatchObject({ type: "metric", columns: 1, title: "Orders" });
  expect(() => python.runPython("plot.metric(1, columns=3)")).toThrow("columns must be 1 or 2");
  expect(() => python.runPython("plot.metric({})")).toThrow("requires values with string labels");
});
