import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatChartValue, getLegendProps } from "@/components/contents/chart/formatting";
import type { PieChartAdapterProps } from "@/components/contents/chart/types";

export const PieChartAdapter = ({ definition, formatting, data }: PieChartAdapterProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        nameKey={definition.name}
        dataKey={definition.value}
        innerRadius={48}
        outerRadius={100}
        paddingAngle={2}
      >
        {data.map((_, index) => (
          <Cell fill={formatting.colors[index % formatting.colors.length]} key={index} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => formatChartValue(value, formatting.yAxis.format)} />
      {formatting.legend.visible && <Legend {...getLegendProps(formatting.legend)} />}
    </PieChart>
  </ResponsiveContainer>
);
