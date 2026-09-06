import { BarChartAdapter } from "@/components/contents/chart/BarChartAdapter";
import { LineChartAdapter } from "@/components/contents/chart/LineChartAdapter";
import { PieChartAdapter } from "@/components/contents/chart/PieChartAdapter";
import { ScatterChartAdapter } from "@/components/contents/chart/ScatterChartAdapter";
import type { ChartContentDefinition, DataRow } from "@/schema/dashboard";

interface ChartRendererProps {
  definition: ChartContentDefinition["chart"];
  data: DataRow[];
}

export const ChartRenderer = ({ definition, data }: ChartRendererProps) => {
  switch (definition.type) {
    case "line":
      return <LineChartAdapter definition={definition} data={data} />;
    case "bar":
      return <BarChartAdapter definition={definition} data={data} />;
    case "pie":
      return <PieChartAdapter definition={definition} data={data} />;
    case "scatter":
      return <ScatterChartAdapter definition={definition} data={data} />;
  }
};
