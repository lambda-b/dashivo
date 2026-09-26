import { BarChartAdapter } from "@/components/contents/chart/BarChartAdapter";
import { LineChartAdapter } from "@/components/contents/chart/LineChartAdapter";
import { PieChartAdapter } from "@/components/contents/chart/PieChartAdapter";
import { ScatterChartAdapter } from "@/components/contents/chart/ScatterChartAdapter";
import type { ChartContentDefinition, DataRow } from "@dashlet/shared/dashboard";

interface ChartRendererProps {
  definition: ChartContentDefinition["chart"];
  formatting: ChartContentDefinition["formatting"];
  data: DataRow[];
}

export const ChartRenderer = ({ definition, formatting, data }: ChartRendererProps) => {
  switch (definition.type) {
    case "line":
      return <LineChartAdapter definition={definition} formatting={formatting} data={data} />;
    case "bar":
      return <BarChartAdapter definition={definition} formatting={formatting} data={data} />;
    case "pie":
      return <PieChartAdapter definition={definition} formatting={formatting} data={data} />;
    case "scatter":
      return <ScatterChartAdapter definition={definition} formatting={formatting} data={data} />;
  }
};
