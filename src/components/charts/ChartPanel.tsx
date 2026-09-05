import type { ComponentType } from "react";
import { LineChartAdapter } from "@/components/charts/LineChartAdapter";
import type { ChartAdapterProps } from "@/components/charts/types";
import type { DataRow, VisualizationDefinition } from "@/schema/dashboard";

const chartCatalog = {
  line: LineChartAdapter,
} satisfies Record<VisualizationDefinition["type"], ComponentType<ChartAdapterProps>>;

interface ChartPanelProps {
  definition: VisualizationDefinition;
  data: DataRow[];
}

export const ChartPanel = ({ definition, data }: ChartPanelProps) => {
  const Chart = chartCatalog[definition.type];

  return (
    <section className="rounded-2xl border border-stone-300 bg-white/70 p-6">
      <p className="mb-2 text-xs font-bold tracking-[0.15em] text-stone-500">RECHARTS</p>
      <h2 className="mb-6 text-2xl font-bold tracking-tight">{definition.title}</h2>
      <div className="h-72 w-full">
        <Chart definition={definition} data={data} />
      </div>
    </section>
  );
};
