import { z } from "zod";

const identifierSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase kebab-case identifier");

const optionSchema = z.object({ label: z.string().min(1), value: z.string().min(1) });
const radioControlSchema = z
  .object({
    type: z.literal("radio"),
    key: z.string().min(1),
    label: z.string().min(1),
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

const metricContentSchema = z.object({
  id: identifierSchema,
  type: z.literal("metric"),
  title: z.string().min(1),
  metric: z.string().min(1),
  format: z.enum(["currency", "number"]),
  emphasis: z.enum(["strong", "accent"]),
});

const lineChartSchema = z.object({
  type: z.literal("line"),
  x: z.string().min(1),
  y: z.array(z.string().min(1)).min(1),
});

const chartContentSchema = z.object({
  id: identifierSchema,
  type: z.literal("chart"),
  title: z.string().min(1),
  dataset: z.string().min(1),
  chart: z.discriminatedUnion("type", [lineChartSchema]),
});

const tableContentSchema = z.object({
  id: identifierSchema,
  type: z.literal("table"),
  title: z.string().min(1),
  dataset: z.string().min(1),
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

const contentSchema = z.discriminatedUnion("type", [
  metricContentSchema,
  chartContentSchema,
  tableContentSchema,
]);

const gridLayoutSchema = z.object({
  type: z.literal("grid"),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

const tabSchema = z.object({
  id: identifierSchema,
  label: z.string().min(1),
  layout: z.discriminatedUnion("type", [gridLayoutSchema]),
  contents: z.array(contentSchema).min(1),
});

export const dashboardSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    controls: z.array(radioControlSchema),
    tabs: z.array(tabSchema).min(1),
  })
  .superRefine((dashboard, context) => {
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

    const contents = dashboard.tabs.flatMap((tab) => tab.contents);
    if (new Set(contents.map((content) => content.id)).size !== contents.length) {
      context.addIssue({
        code: "custom",
        message: "content ids must be unique",
        path: ["tabs"],
      });
    }
  });

const dataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const analysisResultSchema = z.object({
  runtime: z.object({ python: z.string(), pandas: z.string(), numpy: z.string() }),
  datasets: z.record(z.string(), z.array(z.record(z.string(), dataValueSchema))),
  metrics: z.record(z.string(), z.number()),
});

export type DashboardSchema = z.infer<typeof dashboardSchema>;
export type ControlDefinition = DashboardSchema["controls"][number];
export type TabDefinition = DashboardSchema["tabs"][number];
export type ContentDefinition = TabDefinition["contents"][number];
export type MetricContentDefinition = Extract<ContentDefinition, { type: "metric" }>;
export type ChartContentDefinition = Extract<ContentDefinition, { type: "chart" }>;
export type TableContentDefinition = Extract<ContentDefinition, { type: "table" }>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type DataRow = AnalysisResult["datasets"][string][number];
