import type { ChartContentDefinition } from "@/schema/dashboard";

interface ChartContentEditorProps {
  content: ChartContentDefinition;
  onChange: (content: ChartContentDefinition) => void;
}

type ChartDefinition = ChartContentDefinition["chart"];
type ChartType = ChartDefinition["type"];

const chartTypes: ReadonlyArray<{ label: string; value: ChartType }> = [
  { label: "折れ線グラフ", value: "line" },
  { label: "棒グラフ", value: "bar" },
  { label: "円グラフ", value: "pie" },
  { label: "散布図", value: "scatter" },
];

const createChartDefinition = (type: ChartType): ChartDefinition => {
  switch (type) {
    case "line":
    case "bar":
      return { type, x: "", y: [] };
    case "pie":
      return { type, name: "", value: "" };
    case "scatter":
      return { type, x: "", y: "" };
  }
};

const parseChartType = (value: string): ChartType =>
  chartTypes.find((chartType) => chartType.value === value)?.value ?? "line";

interface ChartFieldsProps {
  chart: ChartDefinition;
  onChange: (chart: ChartDefinition) => void;
}

const ChartFields = ({ chart, onChange }: ChartFieldsProps) => {
  if (chart.type === "pie") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-stone-600">
          名前の列
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => onChange({ ...chart, name: event.target.value })}
            value={chart.name}
          />
        </label>
        <label className="text-xs font-medium text-stone-600">
          値の列
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => onChange({ ...chart, value: event.target.value })}
            value={chart.value}
          />
        </label>
      </div>
    );
  }

  if (chart.type === "scatter") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-stone-600">
          X軸の列
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => onChange({ ...chart, x: event.target.value })}
            value={chart.x}
          />
        </label>
        <label className="text-xs font-medium text-stone-600">
          Y軸の列
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => onChange({ ...chart, y: event.target.value })}
            value={chart.y}
          />
        </label>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-stone-600">
          X軸の列
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => onChange({ ...chart, x: event.target.value })}
            value={chart.x}
          />
        </label>
        <label className="text-xs font-medium text-stone-600">
          Y軸の列
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) =>
              onChange({
                ...chart,
                y: event.target.value
                  .split(",")
                  .map((column) => column.trim())
                  .filter(Boolean),
              })
            }
            value={chart.y.join(", ")}
          />
        </label>
      </div>
      <p className="text-xs text-stone-400">複数系列はカンマ区切りで入力します。</p>
    </>
  );
};

export const ChartContentEditor = ({ content, onChange }: ChartContentEditorProps) => (
  <div className="mt-4 grid gap-3">
    <label className="text-xs font-medium text-stone-600">
      チャートタイプ
      <select
        className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none"
        onChange={(event) =>
          onChange({ ...content, chart: createChartDefinition(parseChartType(event.target.value)) })
        }
        value={content.chart.type}
      >
        {chartTypes.map((chartType) => (
          <option key={chartType.value} value={chartType.value}>
            {chartType.label}
          </option>
        ))}
      </select>
    </label>

    <label className="text-xs font-medium text-stone-600">
      Dataset
      <input
        className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
        onChange={(event) => onChange({ ...content, dataset: event.target.value })}
        value={content.dataset}
      />
    </label>

    <ChartFields chart={content.chart} onChange={(chart) => onChange({ ...content, chart })} />
  </div>
);
