import { useReducer, useState, type ReactNode } from "react";
import { ControlEditor } from "@/builder/ControlEditor";
import { TabEditor } from "@/builder/TabEditor";
import { saveDashboardFile } from "@/builder/dashboard-file";
import { builderReducer, createBuilderState } from "@/builder/state";
import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";

interface DashboardBuilderProps {
  initialDashboard: DashboardSchema;
  children: (
    dashboard: DashboardSchema,
    revision: number,
    actions: { openParameters: () => void; openTabs: () => void },
  ) => ReactNode;
}

type BuilderSection = "parameters" | "tabs";

const createControlKey = (dashboard: DashboardSchema) => {
  const keys = new Set(dashboard.controls.map((control) => control.key));
  let index = dashboard.controls.length + 1;
  while (keys.has(`control_${index}`)) index += 1;
  return `control_${index}`;
};

const createTabId = (dashboard: DashboardSchema) => {
  const ids = new Set(dashboard.tabs.map((tab) => tab.id));
  let index = dashboard.tabs.length + 1;
  while (ids.has(`tab-${index}`)) index += 1;
  return `tab-${index}`;
};

const moveItem = <Item,>(items: Item[], index: number, offset: -1 | 1) => {
  const destination = index + offset;
  if (destination < 0 || destination >= items.length) return items;
  const nextItems = [...items];
  [nextItems[index], nextItems[destination]] = [nextItems[destination], nextItems[index]];
  return nextItems;
};

export const DashboardBuilder = ({ initialDashboard, children }: DashboardBuilderProps) => {
  const [state, dispatch] = useReducer(builderReducer, initialDashboard, createBuilderState);
  const [section, setSection] = useState<BuilderSection>();

  const editDashboard = (dashboard: DashboardSchema) => dispatch({ type: "edit", dashboard });

  const applyDraft = () => {
    const result = dashboardSchema.safeParse(state.draft);
    if (!result.success) {
      dispatch({ type: "error", message: result.error.message });
      return;
    }
    dispatch({ type: "apply", dashboard: result.data });
  };

  const saveDraft = async () => {
    const result = dashboardSchema.safeParse(state.draft);
    if (!result.success) {
      dispatch({ type: "error", message: result.error.message });
      return;
    }
    dispatch({ type: "saving" });
    try {
      await saveDashboardFile(result.data);
      dispatch({ type: "saved" });
    } catch (error) {
      dispatch({
        type: "error",
        message: error instanceof Error ? error.message : "dashboard.jsonを保存できませんでした。",
      });
    }
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

  const addTab = () => {
    const id = createTabId(state.draft);
    editDashboard({
      ...state.draft,
      tabs: [
        ...state.draft.tabs,
        {
          id,
          label: "新しいタブ",
          layout: { type: "grid", columns: 1 },
          contents: [],
        },
      ],
    });
  };

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
                    onClick={addTab}
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
                      onChange={(nextTab) =>
                        editDashboard({
                          ...state.draft,
                          tabs: state.draft.tabs.map((current, tabIndex) =>
                            tabIndex === index ? nextTab : current,
                          ),
                        })
                      }
                      onMoveDown={() =>
                        editDashboard({
                          ...state.draft,
                          tabs: moveItem(state.draft.tabs, index, 1),
                        })
                      }
                      onMoveUp={() =>
                        editDashboard({
                          ...state.draft,
                          tabs: moveItem(state.draft.tabs, index, -1),
                        })
                      }
                      onRemove={() =>
                        editDashboard({
                          ...state.draft,
                          tabs: state.draft.tabs.filter((_, tabIndex) => tabIndex !== index),
                        })
                      }
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
                onClick={() => dispatch({ type: "reset", dashboard: initialDashboard })}
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
