import { expect, test } from "@playwright/test";
import { analysisResultsSchema, dashboardSchema } from "@/schema/dashboard";
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
        content: {
          type: "chart",
          title: "Revenue",
          formatting: chartFormatting,
          chart: { type: "line", x: "date", y: ["revenue"] },
        },
      },
      {
        id: "sales-metric",
        type: "python",
        path: "logic/metric.py",
        content: {
          type: "metric",
          title: "Revenue",
          format: "currency",
          emphasis: "strong",
        },
      },
      {
        id: "sales-table",
        type: "python",
        path: "logic/analysis.py",
        content: {
          type: "table",
          title: "Summary",
          columns: [{ key: "date", label: "Date" }],
        },
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
          logic: "sales-metric",
        },
      ],
    },
    {
      id: "charts",
      label: "Charts",
      contents: [
        {
          id: "revenue-chart",
          logic: "sales-analysis",
        },
      ],
    },
    {
      id: "tables",
      label: "Tables",
      contents: [
        {
          id: "summary-table",
          logic: "sales-table",
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
    analysis: {
      ...dashboardSource.analysis,
      logic: [
        ...dashboardSource.analysis.logic,
        ...[
          { id: "revenue-bar", type: "bar", chart: { type: "bar", x: "date", y: ["revenue"] } },
          {
            id: "revenue-pie",
            type: "pie",
            chart: { type: "pie", name: "date", value: "revenue" },
          },
          {
            id: "revenue-scatter",
            type: "scatter",
            chart: { type: "scatter", x: "date", y: "revenue" },
          },
        ].map(({ id, type, chart }) => ({
          id,
          type: "python" as const,
          path: "logic/analysis.py",
          content: { type: "chart" as const, title: type, formatting: chartFormatting, chart },
        })),
      ],
    },
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
              { id: "revenue-bar-placement", logic: "revenue-bar" },
              { id: "revenue-pie-placement", logic: "revenue-pie" },
              { id: "revenue-scatter-placement", logic: "revenue-scatter" },
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
  expect(dashboard.analysis.logic.map((logic) => logic.content.type)).toEqual([
    "chart",
    "metric",
    "table",
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
    analysis: {
      ...dashboardSource.analysis,
      logic: dashboardSource.analysis.logic.map((logic) =>
        logic.id === "sales-analysis"
          ? {
              ...logic,
              content: {
                ...logic.content,
                formatting: {
                  ...logic.content.formatting,
                  yAxis: { ...logic.content.formatting.yAxis, minimum: 100, maximum: 10 },
                },
              },
            }
          : logic,
      ),
    },
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
  const missingLogic = {
    ...dashboardSource,
    tabs: dashboardSource.tabs.map((tab, index) =>
      index === 0
        ? {
            ...tab,
            contents: [{ ...tab.contents[0], logic: "missing-logic" }],
          }
        : tab,
    ),
  };
  expect(() => dashboardSchema.parse(missingLogic)).toThrow("logic「missing-logic」is not defined");
});

test("accepts multiple CSV inputs shared by every Python logic", () => {
  const dashboard = dashboardSchema.parse({
    ...dashboardSource,
    analysis: {
      inputs: [
        ...dashboardSource.analysis.inputs,
        { id: "targets", type: "csv", path: "data/raw/targets.csv" },
      ],
      logic: dashboardSource.analysis.logic,
    },
  });

  expect(dashboard.analysis.inputs.map((input) => input.id)).toEqual(["sales", "targets"]);
});

test("rejects a non-tabular chart result", () => {
  const dashboard = dashboardSchema.parse(dashboardSource);
  const results = analysisResultsSchema.parse({
    "sales-analysis": 0,
    "sales-metric": 0,
    "sales-table": [{ date: "2026-01-01" }],
  });

  expect(() => validateContentBindings(dashboard, results)).toThrow(
    "Pythonロジックは行データの配列を返す必要があります",
  );
});

test("rejects a non-numeric metric result", () => {
  const dashboard = dashboardSchema.parse(dashboardSource);
  const results = analysisResultsSchema.parse({
    "sales-analysis": [{ date: "2026-01-01", revenue: 1 }],
    "sales-metric": [],
    "sales-table": [{ date: "2026-01-01" }],
  });

  expect(() => validateContentBindings(dashboard, results)).toThrow(
    "Pythonロジックは数値を返す必要があります",
  );
});
