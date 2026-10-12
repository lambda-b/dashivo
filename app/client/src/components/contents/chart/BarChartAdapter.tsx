import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatChartValue,
  chartMargin,
  getXAxisProps,
  getYAxisProps,
  getLegendProps,
} from "@/components/contents/chart/formatting";
import type { BarChartAdapterProps } from "@/components/contents/chart/types";

export const BarChartAdapter = ({ definition, formatting, data }: BarChartAdapterProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={chartMargin}>
      {formatting.gridLines && <CartesianGrid stroke="#e7e5e4" vertical={false} />}
      <XAxis dataKey={definition.x} {...getXAxisProps(formatting.xAxis)} />
      <YAxis {...getYAxisProps(formatting.yAxis)} />
      <Tooltip formatter={(value) => formatChartValue(value, formatting.yAxis.format)} />
      {formatting.legend.visible && <Legend {...getLegendProps(formatting.legend)} />}
      {definition.y.map((key, index) => (
        <Bar
          dataKey={key}
          key={key}
          fill={formatting.colors[index % formatting.colors.length]}
          radius={[4, 4, 0, 0]}
        />
      ))}
    </BarChart>
  </ResponsiveContainer>
);
