import { expect, test } from "@playwright/test";
import { analysisResultSchema, dashboardSchema } from "@/schema/dashboard";
import { validateContentBindings } from "@/schema/validation";

const dashboardSource = {
  title: "Example",
  description: "Runtime fixture",
  controls: [
    {
      type: "radio",
      key: "region",
      displayName: "Region",
      defaultValue: "All",
      options: [{ label: "All", value: "All" }],
    },
  ],
  tabs: [
    {
      id: "summary",
      label: "Summary",
      contents: [
        {
          id: "revenue",
          type: "metric",
          title: "Revenue",
          metric: "revenue",
          format: "currency",
          emphasis: "strong",
        },
      ],
    },
    {
      id: "charts",
      label: "Charts",
      contents: [
        {
          id: "revenue-chart",
          type: "chart",
          title: "Revenue",
          dataset: "summary",
          chart: { type: "line", x: "date", y: ["revenue"] },
        },
      ],
    },
    {
      id: "tables",
      label: "Tables",
      contents: [
        {
          id: "summary-table",
          type: "table",
          title: "Summary",
          dataset: "summary",
          columns: [{ key: "date", label: "Date" }],
        },
      ],
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

test("rejects duplicate control option values", () => {
  const invalidDashboard = {
    ...dashboardSource,
    controls: [
      {
        ...dashboardSource.controls[0],
        options: [
          { label: "First", value: "duplicate" },
          { label: "Second", value: "duplicate" },
        ],
        defaultValue: "duplicate",
      },
    ],
  };

  expect(() => dashboardSchema.parse(invalidDashboard)).toThrow("option values must be unique");
});

test("accepts the supported parameter and chart variants", () => {
  const dashboard = dashboardSchema.parse({
    ...dashboardSource,
    controls: [
      ...dashboardSource.controls,
      {
        type: "select",
        key: "segment",
        displayName: "Segment",
        defaultValue: "all",
        options: [{ label: "All", value: "all" }],
      },
      {
        type: "checkbox",
        key: "comparison",
        displayName: "Comparison",
        defaultValue: ["previous-year"],
        options: [{ label: "Previous year", value: "previous-year" }],
        layout: "vertical",
      },
      {
        type: "date-range",
        key: "period",
        displayName: "Period",
        defaultValue: { from: "2026-01-01", to: "2026-12-31" },
      },
    ],
    tabs: dashboardSource.tabs.map((tab) =>
      tab.id === "charts"
        ? {
            ...tab,
            contents: [
              ...tab.contents,
              {
                id: "revenue-bar",
                type: "chart",
                title: "Revenue bar",
                dataset: "summary",
                chart: { type: "bar", x: "date", y: ["revenue"] },
              },
              {
                id: "revenue-pie",
                type: "chart",
                title: "Revenue pie",
                dataset: "summary",
                chart: { type: "pie", name: "date", value: "revenue" },
              },
              {
                id: "revenue-scatter",
                type: "chart",
                title: "Revenue scatter",
                dataset: "summary",
                chart: { type: "scatter", x: "date", y: "revenue" },
              },
            ],
          }
        : tab,
    ),
  });

  expect(dashboard.controls.map((control) => control.type)).toEqual([
    "radio",
    "select",
    "checkbox",
    "date-range",
  ]);
  expect(dashboard.tabs[1].contents.map((content) => content.type)).toEqual([
    "chart",
    "chart",
    "chart",
    "chart",
  ]);
});

test("rejects duplicate tab and content identifiers", () => {
  const duplicateTab = {
    ...dashboardSource,
    tabs: [...dashboardSource.tabs, { ...dashboardSource.tabs[0] }],
  };
  expect(() => dashboardSchema.parse(duplicateTab)).toThrow("tab ids must be unique");

  const duplicateContent = {
    ...dashboardSource,
    tabs: dashboardSource.tabs.map((tab, index) =>
      index === 1 ? { ...tab, contents: [{ ...tab.contents[0], id: "revenue" }] } : tab,
    ),
  };
  expect(() => dashboardSchema.parse(duplicateContent)).toThrow("content ids must be unique");
});

test("rejects a missing result dataset", () => {
  const dashboard = dashboardSchema.parse(dashboardSource);
  const result = analysisResultSchema.parse({
    runtime: { python: "3", pandas: "3", numpy: "2" },
    datasets: {},
    metrics: { revenue: 0, orders: 0 },
  });

  expect(() => validateContentBindings(dashboard, result)).toThrow(
    "dataset「summary」がありません",
  );
});

test("rejects a missing result metric", () => {
  const dashboard = dashboardSchema.parse(dashboardSource);
  const result = analysisResultSchema.parse({
    runtime: { python: "3", pandas: "3", numpy: "2" },
    datasets: { summary: [{ date: "2026-01-01", revenue: 1 }] },
    metrics: {},
  });

  expect(() => validateContentBindings(dashboard, result)).toThrow(
    "Metric「Revenue」の値「revenue」がありません",
  );
});
