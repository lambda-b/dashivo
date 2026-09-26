import { ChartRenderer } from "@/components/contents/chart/ChartRenderer";
import type { ChartContentDefinition, DataRow } from "@shared/dashboard";

interface ChartPanelProps {
  definition: ChartContentDefinition;
  data: DataRow[];
}

export const ChartPanel = ({ definition, data }: ChartPanelProps) => (
  <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
    <p className="mb-2 text-xs font-bold tracking-[0.15em] text-stone-500">RECHARTS</p>
    <h2 className="mb-6 text-2xl font-bold tracking-tight">{definition.title}</h2>
    <div className="h-72 w-full">
      <ChartRenderer definition={definition.chart} formatting={definition.formatting} data={data} />
    </div>
  </section>
);
