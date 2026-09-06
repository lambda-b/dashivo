import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type {
  ContentDefinition,
  MetricContentDefinition,
  TableContentDefinition,
} from "@/schema/dashboard";

interface ContentEditorProps {
  content: ContentDefinition;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (content: ContentDefinition) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}

const contentTypeLabels: Record<ContentDefinition["type"], string> = {
  metric: "METRIC",
  chart: "LINE CHART",
  table: "TABLE",
};

const numberFormats = ["number", "currency"] as const;
const parseNumberFormat = (value: string): MetricContentDefinition["format"] =>
  numberFormats.find((format) => format === value) ?? "number";

const parseOptionalNumberFormat = (
  value: string,
): TableContentDefinition["columns"][number]["format"] =>
  value === "" ? undefined : parseNumberFormat(value);

export const ContentEditor = ({
  content,
  index,
  isFirst,
  isLast,
  onChange,
  onMoveDown,
  onMoveUp,
  onRemove,
}: ContentEditorProps) => (
  <fieldset
    aria-label={`コンテンツ${index + 1}`}
    className="rounded-lg border border-stone-200 p-4"
  >
    <div className="mb-4 flex items-center justify-between gap-4">
      <legend className="text-xs font-bold tracking-wide text-stone-500">
        {contentTypeLabels[content.type]}
      </legend>
      <div className="flex items-center gap-1">
        <button
          aria-label={`${content.title}を上へ移動`}
          className="cursor-pointer rounded-md p-2 text-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
          disabled={isFirst}
          onClick={onMoveUp}
          type="button"
        >
          <ArrowUp aria-hidden="true" className="size-3.5" />
        </button>
        <button
          aria-label={`${content.title}を下へ移動`}
          className="cursor-pointer rounded-md p-2 text-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
          disabled={isLast}
          onClick={onMoveDown}
          type="button"
        >
          <ArrowDown aria-hidden="true" className="size-3.5" />
        </button>
        <button
          aria-label={`${content.title}を削除`}
          className="cursor-pointer rounded-md p-2 text-red-700 hover:bg-red-50"
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <label className="text-xs font-medium text-stone-600">
        Content ID
        <input
          className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
          onChange={(event) => onChange({ ...content, id: event.target.value })}
          value={content.id}
        />
      </label>
      <label className="text-xs font-medium text-stone-600">
        タイトル
        <input
          className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
          onChange={(event) => onChange({ ...content, title: event.target.value })}
          value={content.title}
        />
      </label>
    </div>

    {content.type === "metric" ? (
      <div className="mt-4 grid grid-cols-3 gap-3">
        <label className="col-span-3 text-xs font-medium text-stone-600">
          Metric key
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => onChange({ ...content, metric: event.target.value })}
            value={content.metric}
          />
        </label>
        <label className="text-xs font-medium text-stone-600">
          表示形式
          <select
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none"
            onChange={(event) =>
              onChange({ ...content, format: parseNumberFormat(event.target.value) })
            }
            value={content.format}
          >
            <option value="number">数値</option>
            <option value="currency">通貨</option>
          </select>
        </label>
        <label className="col-span-2 text-xs font-medium text-stone-600">
          強調
          <select
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none"
            onChange={(event) =>
              onChange({
                ...content,
                emphasis: event.target.value === "strong" ? "strong" : "accent",
              })
            }
            value={content.emphasis}
          >
            <option value="accent">アクセント</option>
            <option value="strong">強い強調</option>
          </select>
        </label>
      </div>
    ) : content.type === "chart" ? (
      <div className="mt-4 grid gap-3">
        <label className="text-xs font-medium text-stone-600">
          Dataset
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => onChange({ ...content, dataset: event.target.value })}
            value={content.dataset}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-stone-600">
            X軸の列
            <input
              className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
              onChange={(event) =>
                onChange({ ...content, chart: { ...content.chart, x: event.target.value } })
              }
              value={content.chart.x}
            />
          </label>
          <label className="text-xs font-medium text-stone-600">
            Y軸の列
            <input
              className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
              onChange={(event) =>
                onChange({
                  ...content,
                  chart: {
                    ...content.chart,
                    y: event.target.value
                      .split(",")
                      .map((column) => column.trim())
                      .filter(Boolean),
                  },
                })
              }
              value={content.chart.y.join(", ")}
            />
          </label>
        </div>
        <p className="text-xs text-stone-400">複数系列はカンマ区切りで入力します。</p>
      </div>
    ) : (
      <div className="mt-4 grid gap-3">
        <label className="text-xs font-medium text-stone-600">
          Dataset
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => onChange({ ...content, dataset: event.target.value })}
            value={content.dataset}
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-stone-600">表示列</span>
          <button
            className="cursor-pointer rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            onClick={() =>
              onChange({
                ...content,
                columns: [...content.columns, { key: "column", label: "列" }],
              })
            }
            type="button"
          >
            列を追加
          </button>
        </div>
        {content.columns.map((column, columnIndex) => (
          <div className="grid grid-cols-[1fr_1fr_7rem_auto] gap-2" key={columnIndex}>
            <input
              aria-label={`列${columnIndex + 1}のキー`}
              className="focus:border-brand min-w-0 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
              onChange={(event) =>
                onChange({
                  ...content,
                  columns: content.columns.map((current, index) =>
                    index === columnIndex ? { ...current, key: event.target.value } : current,
                  ),
                })
              }
              value={column.key}
            />
            <input
              aria-label={`列${columnIndex + 1}の表示名`}
              className="focus:border-brand min-w-0 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
              onChange={(event) =>
                onChange({
                  ...content,
                  columns: content.columns.map((current, index) =>
                    index === columnIndex ? { ...current, label: event.target.value } : current,
                  ),
                })
              }
              value={column.label}
            />
            <select
              aria-label={`列${columnIndex + 1}の表示形式`}
              className="focus:border-brand min-w-0 rounded-md border border-stone-300 bg-white px-2 py-2 text-sm outline-none"
              onChange={(event) =>
                onChange({
                  ...content,
                  columns: content.columns.map((current, index) =>
                    index === columnIndex
                      ? { ...current, format: parseOptionalNumberFormat(event.target.value) }
                      : current,
                  ),
                })
              }
              value={column.format ?? ""}
            >
              <option value="">標準</option>
              <option value="number">数値</option>
              <option value="currency">通貨</option>
            </select>
            <button
              aria-label={`列${columnIndex + 1}を削除`}
              className="cursor-pointer rounded-md border border-stone-200 px-3 text-stone-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={content.columns.length === 1}
              onClick={() =>
                onChange({
                  ...content,
                  columns: content.columns.filter((_, index) => index !== columnIndex),
                })
              }
              type="button"
            >
              −
            </button>
          </div>
        ))}
      </div>
    )}
  </fieldset>
);
