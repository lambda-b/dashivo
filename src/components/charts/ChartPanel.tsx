import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DataRow, VisualizationDefinition } from "@/schema/dashboard";

interface ChartPanelProps {
  definition: VisualizationDefinition;
  data: DataRow[];
}

export const ChartPanel = ({ definition, data }: ChartPanelProps) => {
  return (
    <section className="rounded-2xl border border-stone-300 bg-white/70 p-6">
      <p className="mb-2 text-xs font-bold tracking-[0.15em] text-stone-500">RECHARTS</p>
      <h2 className="mb-6 text-2xl font-bold tracking-tight">{definition.title}</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 24 }}>
            <CartesianGrid stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey={definition.x} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={72} />
            <Tooltip formatter={(value) => Number(value).toLocaleString("ja-JP")} />
            {definition.y.map((key) => (
              <Line
                dataKey={key}
                key={key}
                stroke="#1f7655"
                strokeWidth={3}
                dot={{ r: 4, fill: "#1f7655" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
