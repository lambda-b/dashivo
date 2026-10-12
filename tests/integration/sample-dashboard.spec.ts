import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { loadPyodide } from "pyodide";
import sample from "@/sample/dashboard.json" with { type: "json" };

test("sample Python applies region and inclusive date ranges to every output", async () => {
  const python = await loadPyodide({
    indexURL: path.dirname(fileURLToPath(import.meta.resolve("pyodide"))),
    packageCacheDir: path.resolve(".pyodide-cache"),
  });
  await python.loadPackage("pandas");
  python.FS.writeFile(
    "/home/pyodide/dashivo.py",
    await fs.readFile("app/client/src/ports/workers/python/dashivo.py", "utf8"),
  );
  python.runPython("from dashivo import serialize\nimport pandas as pd, io");
  python.globals.set(
    "sample_csv",
    await fs.readFile("app/client/src/sample/data/sales.csv", "utf8"),
  );

  const cases = [
    { params: {}, revenue: 754000, orders: 255, days: 90, first: "2026-01-01", last: "2026-03-31" },
    {
      params: { sales_period: { from: "2026-02-01", to: "2026-02-01" } },
      revenue: 11000,
      orders: 4,
      days: 1,
      first: "2026-02-01",
      last: "2026-02-01",
    },
    {
      params: { region: "East", sales_period: { from: "2026-01-02", to: "2026-02-28" } },
      revenue: 262000,
      orders: 88,
      days: 58,
      first: "2026-01-02",
      last: "2026-02-28",
    },
    {
      params: { region: "West", sales_period: { from: "2026-02-01", to: "" } },
      revenue: 237000,
      orders: 81,
      days: 59,
      first: "2026-02-01",
      last: "2026-03-31",
    },
    {
      params: { sales_period: { from: "", to: "2026-02-01" } },
      revenue: 234000,
      orders: 80,
      days: 32,
      first: "2026-01-01",
      last: "2026-02-01",
    },
    {
      params: { sales_period: { from: "2027-01-01", to: "2027-12-31" } },
      revenue: 0,
      orders: 0,
      days: 0,
      first: undefined,
      last: undefined,
    },
  ];

  for (const { params, revenue, orders, days, first, last } of cases) {
    using pythonParams = python.toPy(params);
    python.globals.set("sample_params", pythonParams);
    for (const logic of sample.dashboard.analysis.logic) {
      const source = await fs.readFile(path.join("app/client/src/sample", logic.path), "utf8");
      // 固定サンプルとローカルの保存済みPythonのどちらも同じ処理にする。
      expect(await fs.readFile(path.join("dashboard/sales-overview", logic.path), "utf8")).toBe(
        source,
      );
      python.globals.set("logic_source", source);
      const result = JSON.parse(
        python.runPython(`
namespace = {}
exec(logic_source, namespace)
serialize(namespace["execute"]({"sales": pd.read_csv(io.StringIO(sample_csv))}, sample_params))
`),
      );
      if (logic.id === "sales-revenue") expect(result.data[0].value).toBe(revenue);
      else if (logic.id === "sales-orders") expect(result.data[0].value).toBe(orders);
      else {
        expect(result.data).toHaveLength(days);
        expect(result.data[0]?.date).toBe(first);
        expect(result.data.at(-1)?.date).toBe(last);
        expect(
          result.data.reduce((sum: number, row: { revenue: number }) => sum + row.revenue, 0),
        ).toBe(revenue);
        expect(
          result.data.reduce((sum: number, row: { orders: number }) => sum + row.orders, 0),
        ).toBe(orders);
      }
    }
  }
});
