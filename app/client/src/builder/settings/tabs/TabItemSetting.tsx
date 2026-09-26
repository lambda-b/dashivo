import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { IconButton } from "@/components/primitives/IconButton";
import type { TabDefinition } from "@dashlet/shared/dashboard";

interface TabItemSettingProps {
  tab: TabDefinition;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  onChange: (tab: TabDefinition) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}

export const TabItemSetting = ({
  tab,
  index,
  isFirst,
  isLast,
  canRemove,
  onChange,
  onMoveDown,
  onMoveUp,
  onRemove,
}: TabItemSettingProps) => (
  <fieldset aria-label={`タブ${index + 1}`} className="rounded-lg border border-stone-200 p-4">
    <div className="mb-4 flex items-center justify-between gap-4">
      <legend className="text-xs font-bold tracking-wide text-stone-500">TAB {index + 1}</legend>
      <div className="flex items-center gap-1">
        <IconButton
          disabled={isFirst}
          icon={ArrowUp}
          label={`${tab.label}を上へ移動`}
          onClick={onMoveUp}
        />
        <IconButton
          disabled={isLast}
          icon={ArrowDown}
          label={`${tab.label}を下へ移動`}
          onClick={onMoveDown}
        />
        <IconButton
          disabled={!canRemove}
          icon={Trash2}
          label={`${tab.label}を削除`}
          onClick={onRemove}
          variant="danger"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <label className="text-xs font-medium text-stone-600">
        Route ID
        <input
          className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
          onChange={(event) => onChange({ ...tab, id: event.target.value })}
          value={tab.id}
        />
      </label>
      <label className="text-xs font-medium text-stone-600">
        表示名
        <input
          className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
          onChange={(event) => onChange({ ...tab, label: event.target.value })}
          value={tab.label}
        />
      </label>
    </div>

    <p className="mt-3 text-xs text-stone-400">コンテンツ {tab.contents.length}件</p>
  </fieldset>
);
