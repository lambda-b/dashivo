import { Plus } from "lucide-react";
import { useState } from "react";
import { ControlCatalogDialog } from "@/builder/components/ControlCatalogDialog";
import { CheckboxControlEditor } from "@/builder/editors/controls/CheckboxControlEditor";
import { ChoiceControlEditor } from "@/builder/editors/controls/ChoiceControlEditor";
import { DateRangeControlEditor } from "@/builder/editors/controls/DateRangeControlEditor";
import type { ControlDefinition, DashboardSchema } from "@/schema/dashboard";

interface ControlActions {
  add: (type: ControlDefinition["type"]) => void;
  remove: (index: number) => void;
  update: (index: number, control: ControlDefinition) => void;
}

interface ControlEditorProps {
  actions: ControlActions;
  dashboard: DashboardSchema;
}

export const ControlEditor = ({ actions, dashboard }: ControlEditorProps) => {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold">Parameters</h3>
          <p className="mt-1 text-xs text-stone-500">画面表示ロジックへ渡す入力項目です。</p>
        </div>
        <button
          className="bg-brand hover:bg-brand-dark inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white"
          onClick={() => setIsCatalogOpen(true)}
          type="button"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          項目を追加
        </button>
      </div>

      <div className="grid gap-3">
        {dashboard.controls.map((control, index) => {
          switch (control.type) {
            case "radio":
            case "select":
              return (
                <ChoiceControlEditor
                  control={control}
                  key={index}
                  onChange={(nextControl) => actions.update(index, nextControl)}
                  onRemove={() => actions.remove(index)}
                />
              );
            case "checkbox":
              return (
                <CheckboxControlEditor
                  key={index}
                  control={control}
                  onChange={(nextControl) => actions.update(index, nextControl)}
                  onRemove={() => actions.remove(index)}
                />
              );
            case "date-range":
              return (
                <DateRangeControlEditor
                  key={index}
                  control={control}
                  onChange={(nextControl) => actions.update(index, nextControl)}
                  onRemove={() => actions.remove(index)}
                />
              );
          }
        })}
        {dashboard.controls.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">
            Parameterはまだありません。
          </p>
        )}
      </div>

      <ControlCatalogDialog
        onAdd={actions.add}
        onClose={() => setIsCatalogOpen(false)}
        open={isCatalogOpen}
      />
    </section>
  );
};
