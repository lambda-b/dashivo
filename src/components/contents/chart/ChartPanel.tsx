import type { ComponentType } from "react";
import { LineChartAdapter } from "@/components/contents/chart/LineChartAdapter";
import type { ChartAdapterProps } from "@/components/contents/chart/types";
import type { ChartContentDefinition, DataRow } from "@/schema/dashboard";

const chartCatalog = {
  line: LineChartAdapter,
} satisfies Record<ChartContentDefinition["chart"]["type"], ComponentType<ChartAdapterProps>>;

interface ChartPanelProps {
  definition: ChartContentDefinition;
  data: DataRow[];
}

export const ChartPanel = ({ definition, data }: ChartPanelProps) => {
  const Chart = chartCatalog[definition.chart.type];

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="mb-2 text-xs font-bold tracking-[0.15em] text-stone-500">RECHARTS</p>
      <h2 className="mb-6 text-2xl font-bold tracking-tight">{definition.title}</h2>
      <div className="h-72 w-full">
        <Chart definition={definition.chart} data={data} />
      </div>
    </section>
  );
};
