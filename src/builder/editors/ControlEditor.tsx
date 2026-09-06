import { RadioControlEditor } from "@/builder/editors/controls/RadioControlEditor";
import type { ControlDefinition, DashboardSchema } from "@/schema/dashboard";

interface ControlActions {
  addRadio: () => void;
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
      <button
        className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        onClick={actions.addRadio}
        type="button"
      >
        Radioを追加
      </button>
    </div>

    <div className="grid gap-3">
      {dashboard.controls.map((control, index) => (
        <RadioControlEditor
          control={control}
          key={index}
          onChange={(nextControl) => actions.update(index, nextControl)}
          onRemove={() => actions.remove(index)}
        />
      ))}
      {dashboard.controls.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">
          Parameterはまだありません。
        </p>
      )}
    </div>
  </section>
);
