import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/primitives/Checkbox";
import { IconButton } from "@/components/primitives/IconButton";
import { NumberInput } from "@/components/primitives/NumberInput";
import { SelectList } from "@/components/primitives/SelectList";
import type {
  AxisFormattingDefinition,
  ChartContentDefinition,
  ChartFormattingDefinition,
} from "@/schema/dashboard";

interface ChartFormattingEditorProps {
  chartType: ChartContentDefinition["chart"]["type"];
  formatting: ChartFormattingDefinition;
  onChange: (formatting: ChartFormattingDefinition) => void;
}

const legendPositions = [
  { label: "上", value: "top" },
  { label: "右", value: "right" },
  { label: "下", value: "bottom" },
  { label: "左", value: "left" },
] as const;

const numberFormats = [
  { label: "自動", value: "auto" },
  { label: "数値", value: "number" },
  { label: "通貨", value: "currency" },
  { label: "パーセント", value: "percent" },
] as const;

const parseLegendPosition = (value: string): ChartFormattingDefinition["legend"]["position"] =>
  legendPositions.find((option) => option.value === value)?.value ?? "bottom";

const parseNumberFormat = (value: string): AxisFormattingDefinition["format"] =>
  numberFormats.find((option) => option.value === value)?.value ?? "auto";

interface AxisFormattingEditorProps {
  axis: AxisFormattingDefinition;
  label: string;
  onChange: (axis: AxisFormattingDefinition) => void;
  supportsRange: boolean;
}

const AxisFormattingEditor = ({
  axis,
  label,
  onChange,
  supportsRange,
}: AxisFormattingEditorProps) => (
  <section className="grid gap-3 rounded-lg border border-stone-200 p-3">
    <h5 className="text-xs font-bold text-stone-700">{label}</h5>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-xs font-medium text-stone-600">
        軸タイトル
        <input
          aria-label={`${label}の軸タイトル`}
          className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
          onChange={(event) => onChange({ ...axis, title: event.target.value })}
          placeholder="タイトルなし"
          value={axis.title}
        />
      </label>
      <label className="text-xs font-medium text-stone-600">
        表示形式
        <div className="mt-1">
          <SelectList
            onChange={(format) => onChange({ ...axis, format: parseNumberFormat(format) })}
            options={numberFormats}
            value={axis.format}
          />
        </div>
      </label>
    </div>
    {supportsRange && (
      <div className="grid grid-cols-2 gap-3">
        {(["minimum", "maximum"] as const).map((boundary) => {
          const value = axis[boundary];
          return (
            <div className="grid gap-1" key={boundary}>
              <span className="text-xs font-medium text-stone-600">
                {boundary === "minimum" ? "最小値" : "最大値"}
              </span>
              <div className="grid grid-cols-[6rem_1fr] gap-2">
                <SelectList
                  ariaLabel={`${label}の${boundary === "minimum" ? "最小値" : "最大値"}の設定`}
                  onChange={(mode) =>
                    onChange({
                      ...axis,
                      [boundary]: mode === "auto" ? null : boundary === "minimum" ? 0 : 100,
                    })
                  }
                  options={[
                    { label: "自動", value: "auto" },
                    { label: "固定", value: "fixed" },
                  ]}
                  value={value === null ? "auto" : "fixed"}
                />
                {value !== null && (
                  <NumberInput
                    ariaLabel={`${label}の${boundary === "minimum" ? "最小値" : "最大値"}`}
                    onChange={(nextValue) => onChange({ ...axis, [boundary]: nextValue })}
                    value={value}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </section>
);

export const ChartFormattingEditor = ({
  chartType,
  formatting,
  onChange,
}: ChartFormattingEditorProps) => (
  <div className="grid gap-3">
    <details className="rounded-lg border border-stone-200 bg-white p-3" open>
      <summary className="cursor-pointer text-xs font-bold text-stone-700">
        グラフの書式設定
      </summary>
      <div className="mt-4 grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Checkbox
            layout="vertical"
            name="chart-legend-visible"
            onChange={(options) =>
              onChange({
                ...formatting,
                legend: { ...formatting.legend, visible: options[0].checked },
              })
            }
            options={{
              checked: formatting.legend.visible,
              label: "凡例を表示",
              value: "visible",
            }}
          />
          {formatting.legend.visible && (
            <label className="text-xs font-medium text-stone-600">
              凡例の位置
              <div className="mt-1">
                <SelectList
                  onChange={(position) =>
                    onChange({
                      ...formatting,
                      legend: { ...formatting.legend, position: parseLegendPosition(position) },
                    })
                  }
                  options={legendPositions}
                  value={formatting.legend.position}
                />
              </div>
            </label>
          )}
          {chartType !== "pie" && (
            <Checkbox
              layout="vertical"
              name="chart-grid-lines"
              onChange={(options) => onChange({ ...formatting, gridLines: options[0].checked })}
              options={{
                checked: formatting.gridLines,
                label: "目盛線を表示",
                value: "visible",
              }}
            />
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-stone-600">系列色</span>
            <button
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900"
              onClick={() => onChange({ ...formatting, colors: [...formatting.colors, "#ca2420"] })}
              type="button"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              色を追加
            </button>
          </div>
          {formatting.colors.map((color, index) => (
            <div className="grid grid-cols-[3rem_1fr_2.25rem] items-center gap-2" key={index}>
              <input
                aria-label={`系列色${index + 1}`}
                className="h-9 w-full cursor-pointer rounded border border-stone-300 bg-white p-1"
                onChange={(event) =>
                  onChange({
                    ...formatting,
                    colors: formatting.colors.map((current, colorIndex) =>
                      colorIndex === index ? event.target.value : current,
                    ),
                  })
                }
                type="color"
                value={color}
              />
              <code className="text-xs text-stone-600">{color}</code>
              <IconButton
                disabled={formatting.colors.length === 1}
                icon={Trash2}
                label={`系列色${index + 1}を削除`}
                onClick={() =>
                  onChange({
                    ...formatting,
                    colors: formatting.colors.filter((_, colorIndex) => colorIndex !== index),
                  })
                }
                variant="danger"
              />
            </div>
          ))}
        </div>
      </div>
    </details>

    {chartType !== "pie" && (
      <details className="rounded-lg border border-stone-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-bold text-stone-700">軸の書式設定</summary>
        <div className="mt-4 grid gap-3">
          <AxisFormattingEditor
            axis={formatting.xAxis}
            label="横軸"
            onChange={(xAxis) => onChange({ ...formatting, xAxis })}
            supportsRange={chartType === "scatter"}
          />
          <AxisFormattingEditor
            axis={formatting.yAxis}
            label="縦軸"
            onChange={(yAxis) => onChange({ ...formatting, yAxis })}
            supportsRange
          />
        </div>
      </details>
    )}
  </div>
);
