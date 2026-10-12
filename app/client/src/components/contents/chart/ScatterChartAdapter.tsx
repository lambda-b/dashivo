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
  chartMargin,
  getXAxisProps,
  getYAxisProps,
  getLegendProps,
} from "@/components/contents/chart/formatting";

export const ScatterChartAdapter = ({ definition, formatting, data }: ScatterChartAdapterProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <ScatterChart margin={chartMargin}>
      {formatting.gridLines && <CartesianGrid stroke="#e7e5e4" />}
      <XAxis
        dataKey={definition.x}
        domain={getAxisDomain(formatting.xAxis)}
        {...getXAxisProps(formatting.xAxis)}
      />
      <YAxis dataKey={definition.y} {...getYAxisProps(formatting.yAxis)} />
      <Tooltip formatter={(value) => formatChartValue(value, formatting.yAxis.format)} />
      {formatting.legend.visible && <Legend {...getLegendProps(formatting.legend)} />}
      <Scatter data={data} fill={formatting.colors[0]} name={definition.y} />
    </ScatterChart>
  </ResponsiveContainer>
);
