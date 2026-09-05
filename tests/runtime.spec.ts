import { expect, test } from "@playwright/test";
import { parseDashboardJson, serializeDashboard } from "@/builder/schema";
import { validateDatasetBindings } from "@/runtime/bindings";
import { analysisResultSchema, dashboardSchema } from "@/schema/dashboard";

const dashboardSource = {
  title: "Example",
  description: "Runtime fixture",
  controls: [
    {
      type: "radio",
      key: "region",
      label: "Region",
      defaultValue: "All",
      options: [{ label: "All", value: "All" }],
    },
  ],
  visualizations: [
    { type: "line", title: "Revenue", dataset: "summary", x: "date", y: ["revenue"] },
  ],
  tables: [
    {
      title: "Summary",
      dataset: "summary",
      columns: [{ key: "date", label: "Date" }],
    },
  ],
} as const;

test("rejects a control default that is not in its options", () => {
  const invalidDashboard = {
    ...dashboardSource,
    controls: [{ ...dashboardSource.controls[0], defaultValue: "Unknown" }],
  };

  expect(() => dashboardSchema.parse(invalidDashboard)).toThrow(
    "defaultValue must match one of the control options",
  );
});

test("round-trips a dashboard through the builder schema editor", () => {
  const dashboard = dashboardSchema.parse(dashboardSource);

  expect(parseDashboardJson(serializeDashboard(dashboard))).toEqual(dashboard);
  expect(() => parseDashboardJson("{ invalid json }")).toThrow();
});

test("rejects a missing result dataset", () => {
  const dashboard = dashboardSchema.parse(dashboardSource);
  const result = analysisResultSchema.parse({
    runtime: { python: "3", pandas: "3", numpy: "2" },
    datasets: {},
    metrics: { revenue: 0, orders: 0 },
  });

  expect(() => validateDatasetBindings(dashboard, result)).toThrow(
    "dataset「summary」がありません",
  );
});
