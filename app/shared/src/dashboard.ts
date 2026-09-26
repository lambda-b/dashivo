import { z } from "zod";

const identifierSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase kebab-case identifier");

const dashboardFilePathSchema = (directory: string, extension: string) =>
  z
    .string()
    .refine(
      (value) =>
        value.startsWith(`${directory}/`) &&
        value.endsWith(extension) &&
        !value.includes("\\") &&
        value.split("/").every((segment) => segment !== "" && segment !== "." && segment !== ".."),
      `Path must reference a ${extension} file under ${directory}`,
    );

export const pythonSourcePathSchema = dashboardFilePathSchema("logic", ".py");
export const inputSourcePathSchema = dashboardFilePathSchema("data", ".csv");

const optionSchema = z.object({ label: z.string().min(1), value: z.string().min(1) });

const selectControlSchema = z
  .object({
    type: z.literal("select"),
    key: z.string().min(1),
    displayName: z.string().min(1),
    defaultValue: z.string(),
    options: z.array(optionSchema).min(1),
  })
  .refine(
    (control) =>
      new Set(control.options.map((option) => option.value)).size === control.options.length,
    { message: "option values must be unique", path: ["options"] },
  )
  .refine((control) => control.options.some((option) => option.value === control.defaultValue), {
    message: "defaultValue must match one of the control options",
    path: ["defaultValue"],
  });

const checkboxControlSchema = z
  .object({
    type: z.literal("checkbox"),
    key: z.string().min(1),
    displayName: z.string().min(1),
    defaultValue: z
      .array(z.string())
      .refine((values) => new Set(values).size === values.length, "values must be unique"),
    options: z.array(optionSchema).min(1),
    layout: z.enum(["horizontal", "vertical"]).default("horizontal"),
  })
  .refine(
    (control) =>
      new Set(control.options.map((option) => option.value)).size === control.options.length,
    { message: "option values must be unique", path: ["options"] },
  )
  .refine(
    (control) =>
      control.defaultValue.every((value) =>
        control.options.some((option) => option.value === value),
      ),
    {
      message: "defaultValue must only contain control options",
      path: ["defaultValue"],
    },
  );

const dateRangeControlSchema = z.object({
  type: z.literal("date-range"),
  key: z.string().min(1),
  displayName: z.string().min(1),
  defaultValue: z.object({ from: z.string(), to: z.string() }),
});

const sliderControlSchema = z
  .object({
    type: z.literal("slider"),
    key: z.string().min(1),
    displayName: z.string().min(1),
    defaultValue: z.array(z.number().finite()).min(1),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().finite(),
  })
  .superRefine((control, context) => {
    if (control.min >= control.max) {
      context.addIssue({
        code: "custom",
        message: "max must be greater than min",
        path: ["max"],
      });
    }

    if (control.defaultValue.some((value) => value < control.min || value > control.max)) {
      context.addIssue({
        code: "custom",
        message: "defaultValue must be within the slider range",
        path: ["defaultValue"],
      });
    }

    if (
      control.defaultValue.some(
        (value, index) => index > 0 && value < control.defaultValue[index - 1],
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "defaultValue must be in ascending order",
        path: ["defaultValue"],
      });
    }
  });

const radioControlSchema = z
  .object({
    type: z.literal("radio"),
    key: z.string().min(1),
    displayName: z.string().min(1),
    defaultValue: z.string(),
    options: z.array(optionSchema).min(1),
    layout: z.enum(["horizontal", "vertical"]).default("horizontal"),
  })
  .refine(
    (control) =>
      new Set(control.options.map((option) => option.value)).size === control.options.length,
    { message: "option values must be unique", path: ["options"] },
  )
  .refine((control) => control.options.some((option) => option.value === control.defaultValue), {
    message: "defaultValue must match one of the control options",
    path: ["defaultValue"],
  });

const metricContentSchema = z.object({
  type: z.literal("metric"),
  title: z.string().min(1),
  format: z.enum(["currency", "number"]),
  emphasis: z.enum(["strong", "accent"]),
});

const lineChartSchema = z.object({
  type: z.literal("line"),
  x: z.string().min(1),
  y: z.array(z.string().min(1)).min(1),
});

const barChartSchema = z.object({
  type: z.literal("bar"),
  x: z.string().min(1),
  y: z.array(z.string().min(1)).min(1),
});

const pieChartSchema = z.object({
  type: z.literal("pie"),
  name: z.string().min(1),
  value: z.string().min(1),
});

const scatterPlotSchema = z.object({
  type: z.literal("scatter"),
  x: z.string().min(1),
  y: z.string().min(1),
});

const axisFormattingSchema = z.object({
  title: z.string(),
  format: z.enum(["auto", "number", "currency", "percent"]),
  minimum: z.number().finite().nullable(),
  maximum: z.number().finite().nullable(),
});

const chartFormattingSchema = z
  .object({
    colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i, "must be a six-digit hex color")).min(1),
    legend: z.object({
      visible: z.boolean(),
      position: z.enum(["top", "right", "bottom", "left"]),
    }),
    gridLines: z.boolean(),
    xAxis: axisFormattingSchema,
    yAxis: axisFormattingSchema,
  })
  .superRefine((formatting, context) => {
    for (const axisName of ["xAxis", "yAxis"] as const) {
      const axis = formatting[axisName];
      if (axis.minimum !== null && axis.maximum !== null && axis.minimum >= axis.maximum) {
        context.addIssue({
          code: "custom",
          message: "maximum must be greater than minimum",
          path: [axisName, "maximum"],
        });
      }
    }
  });

const chartContentSchema = z.object({
  type: z.literal("chart"),
  title: z.string().min(1),
  formatting: chartFormattingSchema,
  chart: z.discriminatedUnion("type", [
    lineChartSchema,
    barChartSchema,
    pieChartSchema,
    scatterPlotSchema,
  ]),
});

const tableContentSchema = z.object({
  type: z.literal("table"),
  title: z.string().min(1),
  columns: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        format: z.enum(["currency", "number"]).optional(),
      }),
    )
    .min(1),
});

export const contentSchema = z.discriminatedUnion("type", [
  metricContentSchema,
  chartContentSchema,
  tableContentSchema,
]);

export const analysisSchema = z.object({
  inputs: z.array(
    z.object({
      id: identifierSchema,
      type: z.literal("csv"),
      path: inputSourcePathSchema,
    }),
  ),
  logic: z.array(
    z.object({
      id: identifierSchema,
      type: z.literal("python"),
      path: pythonSourcePathSchema,
    }),
  ),
});

const contentPlacementSchema = z.object({
  id: identifierSchema,
  logic: identifierSchema,
});

const tabSchema = z.object({
  id: identifierSchema,
  label: z.string().min(1),
  contents: z.array(contentPlacementSchema),
});

export const dashboardSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    analysis: analysisSchema,
    controls: z.array(
      z.discriminatedUnion("type", [
        radioControlSchema,
        selectControlSchema,
        checkboxControlSchema,
        dateRangeControlSchema,
        sliderControlSchema,
      ]),
    ),
    tabs: z.array(tabSchema).min(1),
  })
  .superRefine((dashboard, context) => {
    const addDuplicateIdIssue = (ids: string[], path: (string | number)[]) => {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({ code: "custom", message: "ids must be unique", path });
      }
    };

    addDuplicateIdIssue(
      dashboard.analysis.inputs.map((input) => input.id),
      ["analysis", "inputs"],
    );
    addDuplicateIdIssue(
      dashboard.analysis.logic.map((logic) => logic.id),
      ["analysis", "logic"],
    );
    addDuplicateIdIssue(
      dashboard.analysis.logic.map((logic) => logic.path),
      ["analysis", "logic"],
    );
    if (
      new Set(dashboard.controls.map((control) => control.key)).size !== dashboard.controls.length
    ) {
      context.addIssue({
        code: "custom",
        message: "control keys must be unique",
        path: ["controls"],
      });
    }

    if (new Set(dashboard.tabs.map((tab) => tab.id)).size !== dashboard.tabs.length) {
      context.addIssue({ code: "custom", message: "tab ids must be unique", path: ["tabs"] });
    }

    const placements = dashboard.tabs.flatMap((tab) => tab.contents);
    if (new Set(placements.map((content) => content.id)).size !== placements.length) {
      context.addIssue({
        code: "custom",
        message: "content ids must be unique",
        path: ["tabs"],
      });
    }

    const logic = new Map(
      dashboard.analysis.logic.map((definition) => [definition.id, definition]),
    );
    for (const placement of placements) {
      const definition = logic.get(placement.logic);
      if (!definition) {
        context.addIssue({
          code: "custom",
          message: `logic「${placement.logic}」is not defined`,
          path: ["tabs"],
        });
        continue;
      }
    }
  });

export const dashboardSettingsSchema = z.object({
  title: dashboardSchema.shape.title,
  description: dashboardSchema.shape.description,
  controls: dashboardSchema.shape.controls,
  tabs: dashboardSchema.shape.tabs,
});

export const dashboardDefinitionChangeSchema = z.union([
  z.object({ settings: dashboardSettingsSchema }).strict(),
  z.object({ analysis: analysisSchema }).strict(),
]);

export const pythonLogicCreateSchema = z.object({
  id: identifierSchema,
  path: pythonSourcePathSchema,
  source: z.string(),
});

const dataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const dataRowSchema = z.record(z.string(), dataValueSchema);

export const analysisOutputSchema = z
  .object({
    data: z.union([z.number().finite(), z.array(dataRowSchema)]),
    view: contentSchema,
  })
  .superRefine(({ data, view }, context) => {
    const fail = (message: string) => context.addIssue({ code: "custom", message });

    if (view.type === "metric") {
      if (typeof data !== "number") fail("Metricは有限の数値を返す必要があります。");
      return;
    }

    if (!Array.isArray(data)) {
      fail("Chart/Tableは行データの配列を返す必要があります。");
      return;
    }

    const chart = view.type === "chart" ? view.chart : undefined;

    const numeric = chart
      ? chart.type === "pie"
        ? [chart.value]
        : chart.type === "scatter"
          ? [chart.x, chart.y]
          : chart.y
      : view.type === "table"
        ? view.columns.filter((c) => c.format).map((c) => c.key)
        : [];

    const columns = chart
      ? chart.type === "pie"
        ? [chart.name, chart.value]
        : [chart.x, ...numeric]
      : view.type === "table"
        ? view.columns.map((c) => c.key)
        : [];

    data.forEach((row, index) => {
      for (const key of new Set(columns)) {
        if (!(key in row)) fail(`行${index + 1}: 列「${key}」がありません。`);
        else if (numeric.includes(key) && row[key] !== null && typeof row[key] !== "number")
          fail(`行${index + 1}: 列「${key}」は数値またはnullが必要です。`);
      }
    });
  });

export const analysisResultsSchema = z.record(identifierSchema, analysisOutputSchema);

export type DashboardSchema = z.infer<typeof dashboardSchema>;
export type DashboardSettings = z.infer<typeof dashboardSettingsSchema>;
export type DashboardDefinitionChange = z.infer<typeof dashboardDefinitionChangeSchema>;
export type PythonLogicCreate = z.infer<typeof pythonLogicCreateSchema>;
export type AnalysisDefinition = DashboardSchema["analysis"];
export type AnalysisLogicDefinition = AnalysisDefinition["logic"][number];
export type ControlDefinition = DashboardSchema["controls"][number];
export type ParameterValue = ControlDefinition["defaultValue"];
export type ChoiceControlDefinition = Extract<ControlDefinition, { type: "radio" | "select" }>;
export type RadioControlDefinition = Extract<ControlDefinition, { type: "radio" }>;
export type SelectControlDefinition = Extract<ControlDefinition, { type: "select" }>;
export type CheckboxControlDefinition = Extract<ControlDefinition, { type: "checkbox" }>;
export type DateRangeControlDefinition = Extract<ControlDefinition, { type: "date-range" }>;
export type SliderControlDefinition = Extract<ControlDefinition, { type: "slider" }>;
export type TabDefinition = DashboardSchema["tabs"][number];
export type ContentPlacementDefinition = TabDefinition["contents"][number];
export type ContentDefinition = z.infer<typeof contentSchema>;
export type MetricContentDefinition = Extract<ContentDefinition, { type: "metric" }>;
export type ChartContentDefinition = Extract<ContentDefinition, { type: "chart" }>;
export type ChartFormattingDefinition = ChartContentDefinition["formatting"];
export type AxisFormattingDefinition = ChartFormattingDefinition["xAxis"];
export type TableContentDefinition = Extract<ContentDefinition, { type: "table" }>;
export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
export type AnalysisResults = z.infer<typeof analysisResultsSchema>;
export type DataRow = z.infer<typeof dataRowSchema>;
