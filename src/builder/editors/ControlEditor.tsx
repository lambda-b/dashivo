import { CheckboxControlEditor } from "@/builder/editors/controls/CheckboxControlEditor";
import { ChoiceControlEditor } from "@/builder/editors/controls/ChoiceControlEditor";
import { DateRangeControlEditor } from "@/builder/editors/controls/DateRangeControlEditor";
import type { ControlDefinition, DashboardSchema } from "@/schema/dashboard";

const controlCatalog = [
  { type: "radio", label: "Radio" },
  { type: "select", label: "Select" },
  { type: "checkbox", label: "Checkbox" },
  { type: "date-range", label: "Date Range" },
] as const satisfies ReadonlyArray<{ type: ControlDefinition["type"]; label: string }>;

interface ControlActions {
  add: (type: ControlDefinition["type"]) => void;
  remove: (index: number) => void;
  update: (index: number, control: ControlDefinition) => void;
}

interface ControlEditorProps {
  actions: ControlActions;
  dashboard: DashboardSchema;
}

export const ControlEditor = ({ actions, dashboard }: ControlEditorProps) => (
  <section>
    <div className="mb-3 flex items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold">Parameters</h3>
        <p className="mt-1 text-xs text-stone-500">画面表示ロジックへ渡す入力項目です。</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {controlCatalog.map(({ type, label }) => (
          <button
            className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            key={type}
            onClick={() => actions.add(type)}
            type="button"
          >
            {label}を追加
          </button>
        ))}
      </div>
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
  </section>
);
