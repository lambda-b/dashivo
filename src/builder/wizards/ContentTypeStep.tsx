import { ChartLine, Gauge, Table2 } from "lucide-react";
import type { ContentType } from "@/builder/hooks/useContentActions";

interface ContentTypeStepProps {
  onChange: (type: ContentType) => void;
  value?: ContentType;
}

const contentTypes = [
  { type: "metric", label: "指標", description: "重要な数値を大きく表示します。", icon: Gauge },
  {
    type: "chart",
    label: "グラフ",
    description: "データの傾向や比較を可視化します。",
    icon: ChartLine,
  },
  {
    type: "table",
    label: "テーブル",
    description: "行と列で詳細データを表示します。",
    icon: Table2,
  },
] as const;

export const ContentTypeStep = ({ onChange, value }: ContentTypeStepProps) => (
  <div>
    <h3 className="text-lg font-bold">何を表示しますか？</h3>
    <p className="mt-1 text-sm text-stone-500">目的に合うコンテンツタイプを選択します。</p>
    <div className="mt-6 grid grid-cols-3 gap-4">
      {contentTypes.map(({ type, label, description, icon: Icon }) => {
        const selected = value === type;
        return (
          <button
            aria-pressed={selected}
            className={`cursor-pointer rounded-xl border p-5 text-left transition ${selected ? "border-brand bg-brand-soft ring-brand/20 ring-2" : "border-stone-200 hover:border-stone-400"}`}
            key={type}
            onClick={() => onChange(type)}
            type="button"
          >
            <Icon aria-hidden="true" className="text-brand size-6" />
            <strong className="mt-4 block text-sm">{label}</strong>
            <span className="mt-1 block text-xs leading-5 text-stone-500">{description}</span>
          </button>
        );
      })}
    </div>
  </div>
);
