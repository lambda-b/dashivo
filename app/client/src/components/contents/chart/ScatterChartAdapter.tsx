import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScatterChartAdapterProps } from "@/components/contents/chart/types";
import {
  formatChartValue,
  getAxisDomain,
  getLegendProps,
} from "@/components/contents/chart/formatting";

export const ScatterChartAdapter = ({ definition, formatting, data }: ScatterChartAdapterProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <ScatterChart margin={{ bottom: 16, left: 16, right: 24 }}>
      {formatting.gridLines && <CartesianGrid stroke="#e7e5e4" />}
      <XAxis
        dataKey={definition.x}
        domain={getAxisDomain(formatting.xAxis)}
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
        dataKey={definition.y}
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
      <Scatter data={data} fill={formatting.colors[0]} name={definition.y} />
    </ScatterChart>
  </ResponsiveContainer>
);
