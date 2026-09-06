import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScatterChartAdapterProps } from "@/components/contents/chart/types";

export const ScatterChartAdapter = ({ definition, data }: ScatterChartAdapterProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <ScatterChart margin={{ left: 8, right: 24 }}>
      <CartesianGrid stroke="#e7e5e4" />
      <XAxis dataKey={definition.x} tickLine={false} axisLine={false} />
      <YAxis dataKey={definition.y} tickLine={false} axisLine={false} width={72} />
      <Tooltip formatter={(value) => Number(value).toLocaleString("ja-JP")} />
      <Scatter data={data} fill="var(--color-brand)" />
    </ScatterChart>
  </ResponsiveContainer>
);
