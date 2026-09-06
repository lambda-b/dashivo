import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PieChartAdapterProps } from "@/components/contents/chart/types";

const pieColors = ["#ca2420", "#e85d3f", "#f59e0b", "#78716c", "#991b1b", "#fb923c"];

export const PieChartAdapter = ({ definition, data }: PieChartAdapterProps) => (
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
          <Cell fill={pieColors[index % pieColors.length]} key={index} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => Number(value).toLocaleString("ja-JP")} />
    </PieChart>
  </ResponsiveContainer>
);
