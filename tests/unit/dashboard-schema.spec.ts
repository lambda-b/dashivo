import { expect, test } from "@playwright/test";
import { dashboardSchema, analysisOutputSchema } from "@dashivo/shared-schema/dashboard";
import source from "#dashboard/dashboard.json" with { type: "json" };

const metric = { type: "metric", title: "売上", format: "number", emphasis: "accent" };

const table = {
  type: "table",
  title: "表",
  columns: [{ key: "amount", label: "金額", format: "currency" }],
};

for (const type of ["radio", "select", "checkbox"] as const) {
  test(`${type} rejects duplicate options and invalid defaults at the field path`, () => {
    const control = {
      type,
      key: "region",
      displayName: "地域",
      defaultValue: type === "checkbox" ? ["all"] : "all",
      options: [{ label: "All", value: "all" }],
      ...(type !== "select" && { layout: "horizontal" }),
    };
    expect(dashboardSchema.safeParse({ ...source, controls: [control] }).success).toBe(true);

    const duplicate = dashboardSchema.safeParse({
      ...source,
      controls: [
        { ...control, options: [...control.options, { label: "Duplicate", value: "all" }] },
      ],
    });
    expect(duplicate.success).toBe(false);
    if (!duplicate.success) {
      expect(duplicate.error.issues[0].path).toEqual(["controls", 0, "options"]);
    }

    const invalid = dashboardSchema.safeParse({
      ...source,
      controls: [{ ...control, defaultValue: type === "checkbox" ? ["missing"] : "missing" }],
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].path).toEqual(["controls", 0, "defaultValue"]);
    }
  });
}

for (const type of ["radio", "checkbox"] as const) {
  test(`${type} requires an explicit layout`, () => {
    const control = {
      type,
      key: "region",
      displayName: "地域",
      defaultValue: type === "checkbox" ? ["all"] : "all",
      options: [{ label: "All", value: "all" }],
    };
    const result = dashboardSchema.safeParse({ ...source, controls: [control] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["controls", 0, "layout"]);

    for (const layout of ["horizontal", "vertical"]) {
      expect(
        dashboardSchema.safeParse({ ...source, controls: [{ ...control, layout }] }).success,
      ).toBe(true);
    }
  });
}

test("dashboard only stores logic references and requires one path per logic", () => {
  const dashboard = dashboardSchema.parse(source);

  expect(dashboard.analysis.logic[0]).not.toHaveProperty("content");
  expect(() =>
    dashboardSchema.parse({
      ...source,
      analysis: {
        ...source.analysis,
        logic: [...source.analysis.logic, { ...source.analysis.logic[0], id: "duplicate" }],
      },
    }),
  ).toThrow();
});

test("rejects invalid references, duplicate placements and parameter defaults", () => {
  const dashboard = dashboardSchema.parse(source);
  dashboard.tabs[0].contents[0].logic = "missing";

  expect(() => dashboardSchema.parse(dashboard)).toThrow("is not defined");

  const duplicate = dashboardSchema.parse(source);
  duplicate.tabs[0].contents.push(duplicate.tabs[0].contents[0]);

  expect(() => dashboardSchema.parse(duplicate)).toThrow("content ids must be unique");

  const invalid = {
    ...source,
    controls: [
      {
        type: "radio",
        key: "region",
        displayName: "地域",
        defaultValue: "missing",
        options: [{ label: "All", value: "All" }],
        layout: "horizontal",
      },
    ],
  };

  expect(() => dashboardSchema.parse(invalid)).toThrow("defaultValue must match");
});

test("validates Figure types, required columns in every row and nullable numeric values", () => {
  expect(() => analysisOutputSchema.parse({ data: [], view: metric })).toThrow("有限の数値");
  expect(() => analysisOutputSchema.parse({ data: 1, view: table })).toThrow("行データ");
  expect(() => analysisOutputSchema.parse({ data: [{ amount: 1 }, {}], view: table })).toThrow(
    "列「amount」",
  );
  expect(() => analysisOutputSchema.parse({ data: [{ amount: "bad" }], view: table })).toThrow(
    "数値またはnull",
  );
  expect(analysisOutputSchema.parse({ data: [{ amount: null }], view: table }).data).toEqual([
    { amount: null },
  ]);
  expect(() => analysisOutputSchema.parse({ data: Infinity, view: metric })).toThrow();
});

test("rejects invalid chart formatting", () => {
  const view = {
    type: "chart",
    title: "Chart",
    chart: { type: "line", x: "date", y: ["amount"] },
    formatting: {
      colors: ["#ca2420"],
      legend: { visible: true, position: "bottom" },
      gridLines: true,
      xAxis: { title: "", format: "auto", minimum: null, maximum: null },
      yAxis: { title: "", format: "currency", minimum: 10, maximum: 0 },
    },
  };

  expect(() => analysisOutputSchema.parse({ data: [], view })).toThrow("maximum must be greater");
});
