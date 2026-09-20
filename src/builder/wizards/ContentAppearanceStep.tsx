import { ChartContentEditor } from "@/builder/editors/contents/ChartContentEditor";
import { SelectList } from "@/components/primitives/SelectList";
import type { ContentDefinition } from "@/schema/dashboard";

interface ContentAppearanceStepProps {
  content: ContentDefinition;
  onChange: (content: ContentDefinition) => void;
}

export const ContentAppearanceStep = ({ content, onChange }: ContentAppearanceStepProps) => (
  <div className="grid gap-5">
    <div className="grid grid-cols-2 gap-4">
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

    {content.type === "chart" ? (
      <ChartContentEditor content={content} onChange={onChange} section="appearance" />
    ) : content.type === "metric" ? (
      <div className="grid grid-cols-2 gap-4">
        <label className="text-xs font-medium text-stone-600">
          表示形式
          <div className="mt-1">
            <SelectList
              onChange={(format) =>
                onChange({ ...content, format: format === "currency" ? "currency" : "number" })
              }
              options={[
                { label: "数値", value: "number" },
                { label: "通貨", value: "currency" },
              ]}
              value={content.format}
            />
          </div>
        </label>
        <label className="text-xs font-medium text-stone-600">
          強調
          <div className="mt-1">
            <SelectList
              onChange={(emphasis) =>
                onChange({ ...content, emphasis: emphasis === "strong" ? "strong" : "accent" })
              }
              options={[
                { label: "アクセント", value: "accent" },
                { label: "強い強調", value: "strong" },
              ]}
              value={content.emphasis}
            />
          </div>
        </label>
      </div>
    ) : (
      <div className="rounded-lg border border-stone-200 p-4">
        <p className="text-sm font-semibold">表示列</p>
        <p className="mt-1 text-xs text-stone-500">
          詳細な列設定は作成後のコンテンツ編集で変更できます。
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <input
            aria-label="最初の列のキー"
            className="focus:border-brand rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) =>
              onChange({
                ...content,
                columns: [{ ...content.columns[0], key: event.target.value }],
              })
            }
            value={content.columns[0].key}
          />
          <input
            aria-label="最初の列の表示名"
            className="focus:border-brand rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
            onChange={(event) =>
              onChange({
                ...content,
                columns: [{ ...content.columns[0], label: event.target.value }],
              })
            }
            value={content.columns[0].label}
          />
        </div>
      </div>
    )}
  </div>
);
