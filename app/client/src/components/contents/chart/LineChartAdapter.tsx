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
  chartMargin,
  getXAxisProps,
  getYAxisProps,
  getLegendProps,
} from "@/components/contents/chart/formatting";

export const LineChartAdapter = ({ definition, formatting, data }: LineChartAdapterProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={chartMargin}>
      {formatting.gridLines && <CartesianGrid stroke="#e7e5e4" vertical={false} />}
      <XAxis dataKey={definition.x} {...getXAxisProps(formatting.xAxis)} />
      <YAxis {...getYAxisProps(formatting.yAxis)} />
      <Tooltip formatter={(value) => formatChartValue(value, formatting.yAxis.format)} />
      {formatting.legend.visible && <Legend {...getLegendProps(formatting.legend)} />}
      {definition.y.map((key, index) => (
        <Line
          dataKey={key}
          key={key}
          stroke={formatting.colors[index % formatting.colors.length]}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4 }}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);
