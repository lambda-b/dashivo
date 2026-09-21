import { expect, test } from "@playwright/test";
import { dashboardSchema, analysisOutputSchema } from "@/schema/dashboard";
import source from "#dashboard/dashboard.json" with { type: "json" };

const metric = { type: "metric", title: "売上", format: "number", emphasis: "accent" };

const table = {
  type: "table",
  title: "表",
  columns: [{ key: "amount", label: "金額", format: "currency" }],
};

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
