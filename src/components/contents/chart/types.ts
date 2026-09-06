import type { ChartContentDefinition, DataRow } from "@/schema/dashboard";

export interface ChartAdapterProps {
  definition: ChartContentDefinition["chart"];
  data: DataRow[];
}
