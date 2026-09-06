import { ContentEditor } from "@/builder/editors/contents/ContentEditor";
import type { ContentDefinition, DashboardSchema } from "@/schema/dashboard";

interface ContentActions {
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
        <p className="rounded-lg border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">
          編集対象のコンテンツが見つかりません。
        </p>
      )}
    </section>
  );
};
