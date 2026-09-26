import type { ChartContentDefinition, ChartFormattingDefinition, DataRow } from "@shared/dashboard";

interface ChartAdapterProps<Definition> {
  definition: Definition;
  formatting: ChartFormattingDefinition;
  data: DataRow[];
}

export type LineChartAdapterProps = ChartAdapterProps<
  Extract<ChartContentDefinition["chart"], { type: "line" }>
>;
export type BarChartAdapterProps = ChartAdapterProps<
  Extract<ChartContentDefinition["chart"], { type: "bar" }>
>;
export type PieChartAdapterProps = ChartAdapterProps<
  Extract<ChartContentDefinition["chart"], { type: "pie" }>
>;
export type ScatterChartAdapterProps = ChartAdapterProps<
  Extract<ChartContentDefinition["chart"], { type: "scatter" }>
>;
