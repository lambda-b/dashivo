import { FormField } from "@/components/primitives/FormField";
import { TextInput } from "@/components/primitives/TextInput";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { IconButton } from "@/components/primitives/IconButton";
import type { TabDefinition } from "@shared/dashboard";

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
      <FormField label="Route ID">
        <TextInput monospace onChange={(id) => onChange({ ...tab, id })} value={tab.id} />
      </FormField>
      <FormField label="表示名">
        <TextInput onChange={(label) => onChange({ ...tab, label })} value={tab.label} />
      </FormField>
    </div>

    <p className="mt-3 text-xs text-stone-400">コンテンツ {tab.contents.length}件</p>
  </fieldset>
);
