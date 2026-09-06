import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LineChartAdapterProps } from "@/components/contents/chart/types";

export const LineChartAdapter = ({ definition, data }: LineChartAdapterProps) => (
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
          stroke="var(--color-brand)"
          strokeWidth={3}
          dot={{ r: 4, fill: "var(--color-brand)" }}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);
