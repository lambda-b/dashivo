import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { EditorIconButton } from "@/builder/components/EditorIconButton";
import { ChartContentEditor } from "@/builder/editors/contents/ChartContentEditor";
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
  chart: "CHART",
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
        <EditorIconButton
          disabled={isFirst}
          icon={ArrowUp}
          label={`${content.title}を上へ移動`}
          onClick={onMoveUp}
        />
        <EditorIconButton
          disabled={isLast}
          icon={ArrowDown}
          label={`${content.title}を下へ移動`}
          onClick={onMoveDown}
        />
        <EditorIconButton
          icon={Trash2}
          label={`${content.title}を削除`}
          onClick={onRemove}
          variant="danger"
        />
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
      <ChartContentEditor content={content} onChange={onChange} />
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
            <EditorIconButton
              disabled={content.columns.length === 1}
              icon={Trash2}
              label={`列${columnIndex + 1}を削除`}
              onClick={() =>
                onChange({
                  ...content,
                  columns: content.columns.filter((_, index) => index !== columnIndex),
                })
              }
              variant="danger"
            />
          </div>
        ))}
      </div>
    )}
  </fieldset>
);
