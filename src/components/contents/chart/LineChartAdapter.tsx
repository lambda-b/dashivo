import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LineChartAdapterProps } from "@/components/contents/chart/types";
import {
  formatChartValue,
  getAxisDomain,
  getLegendProps,
} from "@/components/contents/chart/formatting";

export const LineChartAdapter = ({ definition, formatting, data }: LineChartAdapterProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ bottom: 16, left: 16, right: 24 }}>
      {formatting.gridLines && <CartesianGrid stroke="#e7e5e4" vertical={false} />}
      <XAxis
        dataKey={definition.x}
        tickFormatter={(value) => formatChartValue(value, formatting.xAxis.format)}
        tickLine={false}
        axisLine={false}
        label={
          formatting.xAxis.title
            ? { value: formatting.xAxis.title, position: "insideBottom", offset: -10 }
            : undefined
        }
      />
      <YAxis
        domain={getAxisDomain(formatting.yAxis)}
        tickFormatter={(value) => formatChartValue(value, formatting.yAxis.format)}
        tickLine={false}
        axisLine={false}
        width={88}
        label={
          formatting.yAxis.title
            ? { value: formatting.yAxis.title, angle: -90, position: "insideLeft" }
            : undefined
        }
      />
      <Tooltip formatter={(value) => formatChartValue(value, formatting.yAxis.format)} />
      {formatting.legend.visible && <Legend {...getLegendProps(formatting.legend)} />}
      {definition.y.map((key, index) => (
        <Line
          dataKey={key}
          key={key}
          stroke={formatting.colors[index % formatting.colors.length]}
          strokeWidth={3}
          dot={{ r: 4, fill: formatting.colors[index % formatting.colors.length] }}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);
