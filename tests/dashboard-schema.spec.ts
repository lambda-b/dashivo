import { expect, test } from "@playwright/test";
import { analysisResultSchema, dashboardSchema } from "@/schema/dashboard";
import { validateContentBindings } from "@/schema/validation";

const chartFormatting = {
  colors: ["#ca2420", "#e85d3f"],
  legend: { visible: true, position: "bottom" },
  gridLines: true,
  xAxis: { title: "Month", format: "auto", minimum: null, maximum: null },
  yAxis: { title: "Revenue", format: "currency", minimum: 0, maximum: null },
} as const;

const dashboardSource = {
  title: "Example",
  description: "Runtime fixture",
  analysis: {
    inputs: [{ id: "sales", type: "csv", path: "data/raw/sales.csv" }],
    logic: [
      {
        id: "sales-analysis",
        type: "python",
        path: "logic/analysis.py",
        input: "sales",
        outputs: { datasets: ["summary"], metrics: ["revenue"] },
      },
    ],
  },
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
          logic: "sales-analysis",
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
          logic: "sales-analysis",
          dataset: "summary",
          formatting: chartFormatting,
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
          logic: "sales-analysis",
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
      {
        type: "slider",
        key: "revenue-range",
        displayName: "Revenue range",
        defaultValue: [25, 75],
        min: 0,
        max: 100,
        step: 5,
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
                logic: "sales-analysis",
                dataset: "summary",
                formatting: chartFormatting,
                chart: { type: "bar", x: "date", y: ["revenue"] },
              },
              {
                id: "revenue-pie",
                type: "chart",
                title: "Revenue pie",
                logic: "sales-analysis",
                dataset: "summary",
                formatting: chartFormatting,
                chart: { type: "pie", name: "date", value: "revenue" },
              },
              {
                id: "revenue-scatter",
                type: "chart",
                title: "Revenue scatter",
                logic: "sales-analysis",
                dataset: "summary",
                formatting: chartFormatting,
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
    "slider",
  ]);
  expect(dashboard.tabs[1].contents.map((content) => content.type)).toEqual([
    "chart",
    "chart",
    "chart",
    "chart",
  ]);
});

test("rejects slider values outside its configured range", () => {
  const invalidDashboard = {
    ...dashboardSource,
    controls: [
      ...dashboardSource.controls,
      {
        type: "slider",
        key: "revenue-range",
        displayName: "Revenue range",
        defaultValue: [20, 120],
        min: 0,
        max: 100,
        step: 5,
      },
    ],
  };

  expect(() => dashboardSchema.parse(invalidDashboard)).toThrow(
    "defaultValue must be within the slider range",
  );
});

test("rejects an invalid fixed chart axis range", () => {
  const invalidDashboard = {
    ...dashboardSource,
    tabs: dashboardSource.tabs.map((tab) =>
      tab.id === "charts"
        ? {
            ...tab,
            contents: tab.contents.map((content) => ({
              ...content,
              formatting: {
                ...content.formatting,
                yAxis: { ...content.formatting.yAxis, minimum: 100, maximum: 10 },
              },
            })),
          }
        : tab,
    ),
  };

  expect(() => dashboardSchema.parse(invalidDashboard)).toThrow(
    "maximum must be greater than minimum",
  );
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

test("rejects invalid analysis logic references", () => {
  const missingInput = {
    ...dashboardSource,
    analysis: {
      ...dashboardSource.analysis,
      logic: [{ ...dashboardSource.analysis.logic[0], input: "missing-input" }],
    },
  };
  expect(() => dashboardSchema.parse(missingInput)).toThrow("input「missing-input」is not defined");

  const undeclaredOutput = {
    ...dashboardSource,
    tabs: dashboardSource.tabs.map((tab, index) =>
      index === 0
        ? {
            ...tab,
            contents: [{ ...tab.contents[0], metric: "undeclared-metric" }],
          }
        : tab,
    ),
  };
  expect(() => dashboardSchema.parse(undeclaredOutput)).toThrow(
    "output「undeclared-metric」is not declared by logic「sales-analysis」",
  );
});

test("rejects a missing result dataset", () => {
  const dashboard = dashboardSchema.parse(dashboardSource);
  const result = analysisResultSchema.parse({
    runtime: { python: "3", pandas: "3", numpy: "2" },
    datasets: {},
    metrics: { revenue: 0, orders: 0 },
  });

  expect(() => validateContentBindings(dashboard, { "sales-analysis": result })).toThrow(
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

  expect(() => validateContentBindings(dashboard, { "sales-analysis": result })).toThrow(
    "Metric「Revenue」の値「revenue」がありません",
  );
});
