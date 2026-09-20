import { ChartFormattingEditor } from "@/builder/editors/contents/ChartFormattingEditor";
import { ChartTypeSelector } from "@/builder/editors/contents/ChartTypeSelector";
import type { ChartContentDefinition } from "@/schema/dashboard";

interface ChartContentEditorProps {
  content: ChartContentDefinition;
  onChange: (content: ChartContentDefinition) => void;
  section?: "all" | "appearance" | "axes";
}

type ChartDefinition = ChartContentDefinition["chart"];
type ChartType = ChartDefinition["type"];

const createChartDefinition = (type: ChartType, current: ChartDefinition): ChartDefinition => {
  if (type === current.type) return current;

  switch (type) {
    case "line":
    case "bar":
      return current.type === "line" || current.type === "bar"
        ? { type, x: current.x, y: current.y }
        : current.type === "pie"
          ? { type, x: current.name, y: [current.value] }
          : { type, x: current.x, y: [current.y] };
    case "pie":
      return current.type === "line" || current.type === "bar"
        ? { type, name: current.x, value: current.y[0] }
        : current.type === "scatter"
          ? { type, name: current.x, value: current.y }
          : current;
    case "scatter":
      return current.type === "line" || current.type === "bar"
        ? { type, x: current.x, y: current.y[0] }
        : current.type === "pie"
          ? { type, x: current.name, y: current.value }
          : current;
  }
};

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

export const ChartContentEditor = ({
  content,
  onChange,
  section = "all",
}: ChartContentEditorProps) => (
  <div className="mt-4 grid gap-3">
    {section !== "axes" && (
      <>
        <ChartTypeSelector
          onChange={(type) =>
            onChange({ ...content, chart: createChartDefinition(type, content.chart) })
          }
          value={content.chart.type}
        />
        <ChartFields chart={content.chart} onChange={(chart) => onChange({ ...content, chart })} />
        <ChartFormattingEditor
          chartType={content.chart.type}
          formatting={content.formatting}
          onChange={(formatting) => onChange({ ...content, formatting })}
          sections="chart"
        />
      </>
    )}
    {section !== "appearance" && (
      <ChartFormattingEditor
        chartType={content.chart.type}
        formatting={content.formatting}
        onChange={(formatting) => onChange({ ...content, formatting })}
        sections="axes"
      />
    )}
  </div>
);
