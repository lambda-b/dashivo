import { useReducer, useState, type ReactNode } from "react";
import { ControlEditor } from "@/builder/ControlEditor";
import { serializeDashboard } from "@/builder/schema";
import { builderReducer, createBuilderState } from "@/builder/state";
import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";

interface DashboardBuilderProps {
  initialDashboard: DashboardSchema;
  children: (dashboard: DashboardSchema, revision: number) => ReactNode;
}

const downloadDashboard = (dashboard: DashboardSchema) => {
  const url = URL.createObjectURL(
    new Blob([serializeDashboard(dashboard)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "dashboard.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const createControlKey = (dashboard: DashboardSchema) => {
  const keys = new Set(dashboard.controls.map((control) => control.key));
  let index = dashboard.controls.length + 1;
  while (keys.has(`control_${index}`)) index += 1;
  return `control_${index}`;
};

export const DashboardBuilder = ({ initialDashboard, children }: DashboardBuilderProps) => {
  const [state, dispatch] = useReducer(builderReducer, initialDashboard, createBuilderState);
  const [isOpen, setIsOpen] = useState(false);

  const editDashboard = (dashboard: DashboardSchema) => dispatch({ type: "edit", dashboard });

  const applyDraft = () => {
    const result = dashboardSchema.safeParse(state.draft);
    if (!result.success) {
      dispatch({ type: "error", message: result.error.message });
      return;
    }
    dispatch({ type: "apply", dashboard: result.data });
  };

  const saveDraft = () => {
    const result = dashboardSchema.safeParse(state.draft);
    if (!result.success) {
      dispatch({ type: "error", message: result.error.message });
      return;
    }
    downloadDashboard(result.data);
  };

  const addRadioControl = () => {
    const key = createControlKey(state.draft);
    editDashboard({
      ...state.draft,
      controls: [
        ...state.draft.controls,
        {
          type: "radio",
          key,
          label: "新しい条件",
          defaultValue: "option-1",
          options: [{ label: "選択肢1", value: "option-1" }],
        },
      ],
    });
  };

  return (
    <>
      {children(state.dashboard, state.revision)}

      {isOpen ? (
        <aside
          aria-label="Dashboard Builder"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-stone-300 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-6 border-b border-stone-200 p-5">
            <div>
              <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">
                DEVELOPMENT ONLY
              </p>
              <h2 className="mt-1 text-xl font-bold">Dashboard Builder</h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                設定を検証してプレビューへ反映します。
              </p>
            </div>
            <button
              aria-label="Builderを閉じる"
              className="cursor-pointer rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              閉じる
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
            <section>
              <h3 className="mb-3 text-sm font-bold">基本設定</h3>
              <div className="grid gap-3">
                <label className="text-xs font-medium text-stone-600">
                  タイトル
                  <input
                    className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
                    onChange={(event) =>
                      editDashboard({ ...state.draft, title: event.target.value })
                    }
                    value={state.draft.title}
                  />
                </label>
                <label className="text-xs font-medium text-stone-600">
                  説明
                  <textarea
                    className="focus:border-brand mt-1 min-h-20 w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
                    onChange={(event) =>
                      editDashboard({ ...state.draft, description: event.target.value })
                    }
                    value={state.draft.description}
                  />
                </label>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold">Controls</h3>
                  <p className="mt-1 text-xs text-stone-500">表示条件として利用する入力です。</p>
                </div>
                <button
                  className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  onClick={addRadioControl}
                  type="button"
                >
                  Radioを追加
                </button>
              </div>

              <div className="grid gap-3">
                {state.draft.controls.map((control, index) => (
                  <ControlEditor
                    control={control}
                    key={index}
                    onChange={(nextControl) =>
                      editDashboard({
                        ...state.draft,
                        controls: state.draft.controls.map((current, controlIndex) =>
                          controlIndex === index ? nextControl : current,
                        ),
                      })
                    }
                    onRemove={() =>
                      editDashboard({
                        ...state.draft,
                        controls: state.draft.controls.filter(
                          (_, controlIndex) => controlIndex !== index,
                        ),
                      })
                    }
                  />
                ))}
                {state.draft.controls.length === 0 && (
                  <p className="rounded-lg border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">
                    Controlはまだありません。
                  </p>
                )}
              </div>
            </section>

            {state.error && (
              <pre
                className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs text-red-800"
                role="alert"
              >
                {state.error}
              </pre>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 p-5">
            <div className="flex gap-2">
              <button
                className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                onClick={() => dispatch({ type: "reset", dashboard: initialDashboard })}
                type="button"
              >
                元に戻す
              </button>
              <button
                className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                onClick={saveDraft}
                type="button"
              >
                JSONを保存
              </button>
            </div>
            <button
              className="bg-brand hover:bg-brand-dark cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-white"
              onClick={applyDraft}
              type="button"
            >
              プレビューへ反映
            </button>
          </footer>
        </aside>
      ) : (
        <button
          className="bg-brand hover:bg-brand-dark fixed right-5 bottom-5 z-50 cursor-pointer rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Builderを開く
        </button>
      )}
    </>
  );
};
