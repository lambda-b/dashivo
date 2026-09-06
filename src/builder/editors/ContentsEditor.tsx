import { ChartLine, Gauge, Table2 } from "lucide-react";
import type { ContentType } from "@/builder/hooks/useContentActions";
import { ContentEditor } from "@/builder/editors/contents/ContentEditor";
import type { ContentDefinition, DashboardSchema } from "@/schema/dashboard";

interface ContentActions {
  add: (tabIndex: number, type: ContentType) => ContentDefinition;
  update: (tabIndex: number, contentIndex: number, content: ContentDefinition) => void;
  move: (tabIndex: number, contentIndex: number, direction: -1 | 1) => void;
  remove: (tabIndex: number, contentIndex: number) => void;
}

interface ContentsEditorProps {
  actions: ContentActions;
  contentIndex?: number;
  dashboard: DashboardSchema;
  onSelect: (contentIndex?: number) => void;
  tabIndex: number;
}

const catalog = [
  { type: "metric", label: "指標", icon: Gauge },
  { type: "chart", label: "グラフ", icon: ChartLine },
  { type: "table", label: "テーブル", icon: Table2 },
] as const;

export const ContentsEditor = ({
  actions,
  contentIndex,
  dashboard,
  onSelect,
  tabIndex,
}: ContentsEditorProps) => {
  const tab = dashboard.tabs[tabIndex];
  const selectedContentIndex = contentIndex ?? -1;
  const content = tab.contents[selectedContentIndex];

  return (
    <section>
      <p className="mb-5 text-xs font-medium text-stone-500">対象タブ: {tab.label}</p>

      {content ? (
        <ContentEditor
          analysis={dashboard.analysis}
          content={content}
          index={selectedContentIndex}
          isFirst={selectedContentIndex === 0}
          isLast={selectedContentIndex === tab.contents.length - 1}
          onChange={(nextContent) => actions.update(tabIndex, selectedContentIndex, nextContent)}
          onMoveDown={() => {
            actions.move(tabIndex, selectedContentIndex, 1);
            onSelect(selectedContentIndex + 1);
          }}
          onMoveUp={() => {
            actions.move(tabIndex, selectedContentIndex, -1);
            onSelect(selectedContentIndex - 1);
          }}
          onRemove={() => {
            actions.remove(tabIndex, selectedContentIndex);
            onSelect();
          }}
        />
      ) : (
        <div>
          <h3 className="text-sm font-bold">コンポーネントを追加</h3>
          <p className="mt-1 text-xs text-stone-500">表示要素を選択して配置します。</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {catalog.map(({ type, label, icon: Icon }) => (
              <button
                className="cursor-pointer rounded-lg border border-stone-200 p-3 text-left text-stone-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                key={type}
                onClick={() => {
                  actions.add(tabIndex, type);
                  onSelect(tab.contents.length);
                }}
                type="button"
              >
                <Icon aria-hidden="true" className="mb-2 size-4" />
                <span className="block text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
