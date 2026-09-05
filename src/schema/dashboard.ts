import { z } from "zod";

const optionSchema = z.object({ label: z.string().min(1), value: z.string().min(1) });
const radioControlSchema = z
  .object({
    type: z.literal("radio"),
    key: z.string().min(1),
    label: z.string().min(1),
    defaultValue: z.string(),
    options: z.array(optionSchema).min(1),
  })
  .refine((control) => control.options.some((option) => option.value === control.defaultValue), {
    message: "defaultValue must match one of the control options",
    path: ["defaultValue"],
  });
const visualizationSchema = z.object({
  type: z.literal("line"),
  title: z.string().min(1),
  dataset: z.string().min(1),
  x: z.string().min(1),
  y: z.array(z.string().min(1)).min(1),
});
const tableSchema = z.object({
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

export const dashboardSchema = z
  .object({
    title: z.string().min(1),
    description: z.string(),
    controls: z.array(radioControlSchema),
    visualizations: z.array(visualizationSchema),
    tables: z.array(tableSchema),
  })
  .refine(
    (dashboard) =>
      new Set(dashboard.controls.map((control) => control.key)).size === dashboard.controls.length,
    { message: "control keys must be unique", path: ["controls"] },
  );

const dataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const analysisResultSchema = z.object({
  runtime: z.object({ python: z.string(), pandas: z.string(), numpy: z.string() }),
  datasets: z.record(z.string(), z.array(z.record(z.string(), dataValueSchema))),
  metrics: z.object({ revenue: z.number(), orders: z.number() }),
});

export type DashboardSchema = z.infer<typeof dashboardSchema>;
export type ControlDefinition = DashboardSchema["controls"][number];
export type TableDefinition = DashboardSchema["tables"][number];
export type VisualizationDefinition = DashboardSchema["visualizations"][number];
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type DataRow = AnalysisResult["datasets"][string][number];
