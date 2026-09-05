import type { DataRow, VisualizationDefinition } from "@/schema/dashboard";

export interface ChartAdapterProps {
  definition: VisualizationDefinition;
  data: DataRow[];
}
