import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { TabDefinition } from "@/schema/dashboard";

interface TabEditorProps {
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

export const TabEditor = ({
  tab,
  index,
  isFirst,
  isLast,
  canRemove,
  onChange,
  onMoveDown,
  onMoveUp,
  onRemove,
}: TabEditorProps) => (
  <fieldset aria-label={`タブ${index + 1}`} className="rounded-lg border border-stone-200 p-4">
    <div className="mb-4 flex items-center justify-between gap-4">
      <legend className="text-xs font-bold tracking-wide text-stone-500">TAB {index + 1}</legend>
      <div className="flex items-center gap-1">
        <button
          aria-label={`${tab.label}を上へ移動`}
          className="cursor-pointer rounded-md p-2 text-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
          disabled={isFirst}
          onClick={onMoveUp}
          type="button"
        >
          <ArrowUp aria-hidden="true" className="size-3.5" />
        </button>
        <button
          aria-label={`${tab.label}を下へ移動`}
          className="cursor-pointer rounded-md p-2 text-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
          disabled={isLast}
          onClick={onMoveDown}
          type="button"
        >
          <ArrowDown aria-hidden="true" className="size-3.5" />
        </button>
        <button
          aria-label={`${tab.label}を削除`}
          className="cursor-pointer rounded-md p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
          disabled={!canRemove}
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
        </button>
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
