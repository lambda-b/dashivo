import { FormField } from "@/components/primitives/FormField";
import { TextInput } from "@/components/primitives/TextInput";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { IconButton } from "@/components/primitives/IconButton";
import { SelectList } from "@/components/primitives/SelectList";
import type { ContentPlacementDefinition, DashboardSchema } from "@shared/dashboard";

interface ContentActions {
  update: (tabIndex: number, contentIndex: number, content: ContentPlacementDefinition) => void;
  move: (tabIndex: number, contentIndex: number, direction: -1 | 1) => void;
  remove: (tabIndex: number, contentIndex: number) => void;
}

interface ContentSettingProps {
  actions: ContentActions;
  contentIndex?: number;
  dashboard: DashboardSchema;
  onSelect: (contentIndex?: number) => void;
  tabIndex: number;
}

export const ContentSetting = ({
  actions,
  contentIndex,
  dashboard,
  onSelect,
  tabIndex,
}: ContentSettingProps) => {
  const tab = dashboard.tabs[tabIndex];
  const selectedContentIndex = contentIndex ?? -1;
  const placement = tab.contents[selectedContentIndex];
  const logic = dashboard.analysis.logic.find((definition) => definition.id === placement?.logic);

  return (
    <section>
      <p className="mb-5 text-xs font-medium text-stone-500">対象タブ: {tab.label}</p>

      {placement ? (
        <fieldset className="rounded-lg border border-stone-200 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <legend className="text-xs font-bold tracking-wide text-stone-500">配置設定</legend>
            <div className="flex items-center gap-1">
              <IconButton
                disabled={selectedContentIndex === 0}
                icon={ArrowUp}
                label="コンテンツを上へ移動"
                onClick={() => {
                  actions.move(tabIndex, selectedContentIndex, -1);
                  onSelect(selectedContentIndex - 1);
                }}
              />
              <IconButton
                disabled={selectedContentIndex === tab.contents.length - 1}
                icon={ArrowDown}
                label="コンテンツを下へ移動"
                onClick={() => {
                  actions.move(tabIndex, selectedContentIndex, 1);
                  onSelect(selectedContentIndex + 1);
                }}
              />
              <IconButton
                icon={Trash2}
                label="コンテンツを削除"
                onClick={() => {
                  actions.remove(tabIndex, selectedContentIndex);
                  onSelect();
                }}
                variant="danger"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <FormField label="Content ID">
              <TextInput
                monospace
                onChange={(id) =>
                  actions.update(tabIndex, selectedContentIndex, {
                    ...placement,
                    id,
                  })
                }
                value={placement.id}
              />
            </FormField>
            <FormField label="Python出力">
              <SelectList
                onChange={(logicId) =>
                  actions.update(tabIndex, selectedContentIndex, {
                    ...placement,
                    logic: logicId,
                  })
                }
                options={dashboard.analysis.logic.map((definition) => ({
                  label: definition.id,
                  value: definition.id,
                }))}
                value={placement.logic}
              />
            </FormField>
            {logic && (
              <dl className="grid gap-2 rounded-md bg-stone-50 p-3 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Logic ID</dt>
                  <dd className="font-mono text-stone-700">{logic.id}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Pythonファイル</dt>
                  <dd className="truncate font-mono text-stone-700">{logic.path}</dd>
                </div>
              </dl>
            )}
            <p className="text-xs leading-5 text-stone-500">
              タイトルやグラフ書式など、出力自体の設定はPython画面で編集します。
            </p>
          </div>
        </fieldset>
      ) : (
        <p className="rounded-lg border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">
          編集対象のコンテンツが見つかりません。
        </p>
      )}
    </section>
  );
};
