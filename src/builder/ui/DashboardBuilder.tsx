import { useState, type ReactNode } from "react";
import { useDashboardDraft } from "@/builder/hooks/useDashboardDraft";
import { useParameterActions } from "@/builder/hooks/useParameterActions";
import { useTabActions } from "@/builder/hooks/useTabActions";
import { ControlEditor } from "@/builder/ui/ControlEditor";
import { TabEditor } from "@/builder/ui/TabEditor";
import type { DashboardSchema } from "@/schema/dashboard";

interface DashboardBuilderProps {
  initialDashboard: DashboardSchema;
  children: (
    dashboard: DashboardSchema,
    revision: number,
    actions: { openParameters: () => void; openTabs: () => void },
  ) => ReactNode;
}

type BuilderSection = "parameters" | "tabs";

export const DashboardBuilder = ({ initialDashboard, children }: DashboardBuilderProps) => {
  const { state, editDashboard, applyDraft, saveDraft, resetDraft } =
    useDashboardDraft(initialDashboard);
  const parameterActions = useParameterActions(state.draft, editDashboard);
  const tabActions = useTabActions(state.draft, editDashboard);
  const [section, setSection] = useState<BuilderSection>();

  return (
    <>
      {children(state.dashboard, state.revision, {
        openParameters: () => setSection("parameters"),
        openTabs: () => setSection("tabs"),
      })}

      {section ? (
        <aside
          aria-label="Dashboard Builder"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-stone-300 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-6 border-b border-stone-200 p-5">
            <div>
              <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">
                DEVELOPMENT ONLY
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {section === "parameters" ? "パラメータ設定" : "タブ設定"}
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                設定を検証してプレビューへ反映します。
              </p>
            </div>
            <button
              aria-label="Builderを閉じる"
              className="cursor-pointer rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
              onClick={() => setSection(undefined)}
              type="button"
            >
              閉じる
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
            {section === "parameters" ? (
              <>
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
                      <h3 className="text-sm font-bold">Parameters</h3>
                      <p className="mt-1 text-xs text-stone-500">
                        画面表示ロジックへ渡す入力項目です。
                      </p>
                    </div>
                    <button
                      className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      onClick={parameterActions.addRadio}
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
                        onChange={(nextControl) => parameterActions.update(index, nextControl)}
                        onRemove={() => parameterActions.remove(index)}
                      />
                    ))}
                    {state.draft.controls.length === 0 && (
                      <p className="rounded-lg border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">
                        Parameterはまだありません。
                      </p>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <section>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold">Tabs</h3>
                    <p className="mt-1 text-xs text-stone-500">
                      コンテンツを切り替えるNavigationです。
                    </p>
                  </div>
                  <button
                    className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    onClick={tabActions.add}
                    type="button"
                  >
                    タブを追加
                  </button>
                </div>

                <div className="grid gap-3">
                  {state.draft.tabs.map((tab, index) => (
                    <TabEditor
                      canRemove={state.draft.tabs.length > 1}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === state.draft.tabs.length - 1}
                      key={index}
                      onChange={(nextTab) => tabActions.update(index, nextTab)}
                      onMoveDown={() => tabActions.move(index, 1)}
                      onMoveUp={() => tabActions.move(index, -1)}
                      onRemove={() => tabActions.remove(index)}
                      tab={tab}
                    />
                  ))}
                </div>
              </section>
            )}

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
                onClick={resetDraft}
                type="button"
              >
                元に戻す
              </button>
              <button
                className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60"
                disabled={state.saveStatus === "saving"}
                onClick={saveDraft}
                type="button"
              >
                {state.saveStatus === "saving" ? "保存中…" : "dashboard.jsonを保存"}
              </button>
            </div>
            {state.saveStatus === "saved" && (
              <span className="text-xs font-medium text-emerald-700">保存しました</span>
            )}
            <button
              className="bg-brand hover:bg-brand-dark cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-white"
              onClick={applyDraft}
              type="button"
            >
              プレビューへ反映
            </button>
          </footer>
        </aside>
      ) : null}
    </>
  );
};
