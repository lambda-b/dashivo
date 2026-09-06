import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BarChartAdapterProps } from "@/components/contents/chart/types";

const barColors = ["#ca2420", "#e85d3f", "#f59e0b", "#78716c"];

export const BarChartAdapter = ({ definition, data }: BarChartAdapterProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ left: 8, right: 24 }}>
      <CartesianGrid stroke="#e7e5e4" vertical={false} />
      <XAxis dataKey={definition.x} tickLine={false} axisLine={false} />
      <YAxis tickLine={false} axisLine={false} width={72} />
      <Tooltip formatter={(value) => Number(value).toLocaleString("ja-JP")} />
      {definition.y.map((key, index) => (
        <Bar
          dataKey={key}
          key={key}
          fill={barColors[index % barColors.length]}
          radius={[4, 4, 0, 0]}
        />
      ))}
    </BarChart>
  </ResponsiveContainer>
);
