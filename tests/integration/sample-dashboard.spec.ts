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
  python.globals.set("sample_csv", sample.sources["data/sales-overview/raw/sales.csv"]);

  const cases = [
    { params: {}, revenue: 754000, orders: 255, dates: ["2026-01-01", "2026-02-01", "2026-03-01"] },
    {
      params: { sales_period: { from: "2026-02-01", to: "2026-02-01" } },
      revenue: 251000,
      orders: 85,
      dates: ["2026-02-01"],
    },
    {
      params: { region: "East", sales_period: { from: "2026-01-02", to: "2026-02-28" } },
      revenue: 141000,
      orders: 47,
      dates: ["2026-02-01"],
    },
    {
      params: { region: "West", sales_period: { from: "2026-02-01", to: "" } },
      revenue: 237000,
      orders: 81,
      dates: ["2026-02-01", "2026-03-01"],
    },
    {
      params: { sales_period: { from: "", to: "2026-02-01" } },
      revenue: 474000,
      orders: 161,
      dates: ["2026-01-01", "2026-02-01"],
    },
    {
      params: { sales_period: { from: "2027-01-01", to: "2027-12-31" } },
      revenue: 0,
      orders: 0,
      dates: [],
    },
  ];

  for (const { params, revenue, orders, dates } of cases) {
    using pythonParams = python.toPy(params);
    python.globals.set("sample_params", pythonParams);
    for (const logic of sample.dashboard.analysis.logic) {
      const source = sample.sources[logic.path as keyof typeof sample.sources];
      // 固定サンプルとローカルの保存済みPythonのどちらも同じ処理にする。
      expect(await fs.readFile(path.join("dashboard", logic.path), "utf8")).toBe(source);
      python.globals.set("logic_source", source);
      const result = JSON.parse(
        python.runPython(`
namespace = {}
exec(logic_source, namespace)
serialize(namespace["execute"]({"sales": pd.read_csv(io.StringIO(sample_csv))}, sample_params))
`),
      );
      if (logic.id === "sales-revenue") expect(result.data).toBe(revenue);
      else if (logic.id === "sales-orders") expect(result.data).toBe(orders);
      else {
        expect(result.data.map((row: { date: string }) => row.date)).toEqual(dates);
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
