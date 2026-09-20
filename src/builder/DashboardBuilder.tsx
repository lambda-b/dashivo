import { useState, type ReactNode } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { saveDashboardFile } from "@/builder/api/dashboardFile";
import { savePythonSource } from "@/builder/api/pythonSource";
import { useContentActions } from "@/builder/hooks/useContentActions";
import { useAnalysisActions } from "@/builder/hooks/useAnalysisActions";
import { useDashboardDraft } from "@/builder/hooks/useDashboardDraft";
import { useParameterActions } from "@/builder/hooks/useParameterActions";
import { useTabActions } from "@/builder/hooks/useTabActions";
import { ContentsEditor } from "@/builder/editors/ContentsEditor";
import { AnalysisEditor } from "@/builder/editors/AnalysisEditor";
import { ControlEditor } from "@/builder/editors/ControlEditor";
import { HeaderEditor } from "@/builder/editors/HeaderEditor";
import { TabEditor } from "@/builder/editors/TabEditor";
import { ContentWizard, type ContentWizardResult } from "@/builder/wizards/ContentWizard";
import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";

interface DashboardBuilderProps {
  initialDashboard: DashboardSchema;
  children: (
    dashboard: DashboardSchema,
    revision: number,
    actions: {
      addContent: (tabIndex: number) => void;
      editContent: (tabIndex: number, contentIndex: number) => void;
      openAnalysis: () => void;
      openHeader: () => void;
      openParameters: () => void;
      openTabs: () => void;
    },
  ) => ReactNode;
}

type BuilderSection = "contents" | "header" | "parameters" | "tabs";

interface ContentTarget {
  contentIndex?: number;
  tabIndex: number;
}

const sectionTitles: Record<BuilderSection, string> = {
  contents: "コンテンツ設定",
  header: "ヘッダー設定",
  parameters: "パラメータ設定",
  tabs: "タブ設定",
};

export const DashboardBuilder = ({ initialDashboard, children }: DashboardBuilderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, editDashboard, applyDashboard, applyDraft, saveDraft, resetDraft } =
    useDashboardDraft(initialDashboard);
  const contentActions = useContentActions(state.draft, editDashboard);
  const analysisActions = useAnalysisActions(state.draft, editDashboard);
  const parameterActions = useParameterActions(state.draft, editDashboard);
  const tabActions = useTabActions(state.draft, editDashboard);
  const [section, setSection] = useState<BuilderSection>();
  const [contentWizardTab, setContentWizardTab] = useState<number>();
  const [contentTarget, setContentTarget] = useState<ContentTarget>({ tabIndex: 0 });
  const pythonRoute = matchPath("/builder/python/:logicId", location.pathname);
  const pythonLogicId = pythonRoute?.params.logicId;

  const openAnalysis = () => {
    const logic = state.draft.analysis.logic[0];
    if (!logic) return;
    navigate(`/builder/python/${logic.id}`, { state: { returnTo: location.pathname } });
  };

  const closeAnalysis = () => {
    const routeState = location.state as { returnTo?: string } | null;
    navigate(routeState?.returnTo ?? `/${state.draft.tabs[0].id}`);
  };

  const openContentEditor = (target: ContentTarget) => {
    setContentTarget(target);
    setSection("contents");
  };

  const completeContent = async ({ content, logic, pythonSource }: ContentWizardResult) => {
    if (contentWizardTab === undefined) return;
    if (logic && state.draft.analysis.logic.some((definition) => definition.path === logic.path)) {
      throw new Error(`Pythonファイル「${logic.path}」はすでに登録されています。`);
    }
    if (logic && !pythonSource?.match(/^\s*def\s+execute\s*\(/m)) {
      throw new Error("Pythonロジックにはexecute(inputs, params)関数を定義してください。");
    }
    const dashboard = dashboardSchema.parse({
      ...state.draft,
      analysis: logic
        ? { ...state.draft.analysis, logic: [...state.draft.analysis.logic, logic] }
        : state.draft.analysis,
      tabs: state.draft.tabs.map((tab, index) =>
        index === contentWizardTab ? { ...tab, contents: [...tab.contents, content] } : tab,
      ),
    });
    if (logic && pythonSource !== undefined) {
      await savePythonSource(logic.path, pythonSource);
      await saveDashboardFile(dashboard);
      window.location.reload();
      return;
    }
    applyDashboard(dashboard);
  };

  return (
    <>
      {!pythonRoute &&
        children(state.dashboard, state.revision, {
          addContent: (tabIndex) => setContentWizardTab(tabIndex),
          editContent: (tabIndex, contentIndex) => openContentEditor({ tabIndex, contentIndex }),
          openAnalysis,
          openHeader: () => setSection("header"),
          openParameters: () => setSection("parameters"),
          openTabs: () => setSection("tabs"),
        })}

      {pythonRoute ? (
        <aside
          aria-label="Python出力を編集"
          className="animate-workbench-in fixed inset-0 z-50 flex flex-col overflow-hidden bg-white shadow-2xl motion-reduce:animate-none"
        >
          <header className="flex items-start justify-between gap-6 border-b border-stone-200 p-5">
            <div>
              <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">
                DEVELOPMENT ONLY
              </p>
              <h2 className="mt-1 text-xl font-bold">Python出力を編集</h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Pythonコードと最終的な出力イメージを同じ画面で確認します。
              </p>
            </div>
            <button
              className="cursor-pointer rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
              onClick={closeAnalysis}
              type="button"
            >
              Dashboardへ戻る
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden">
            <AnalysisEditor
              actions={analysisActions}
              dashboard={state.draft}
              onSelectLogic={(logicId) =>
                navigate(`/builder/python/${logicId}`, { replace: true, state: location.state })
              }
              selectedLogicId={pythonLogicId}
            />
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
              <h2 className="mt-1 text-xl font-bold">{sectionTitles[section]}</h2>
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
            {section === "header" ? (
              <HeaderEditor dashboard={state.draft} onChange={editDashboard} />
            ) : section === "parameters" ? (
              <ControlEditor actions={parameterActions} dashboard={state.draft} />
            ) : section === "contents" ? (
              <ContentsEditor
                actions={contentActions}
                contentIndex={contentTarget.contentIndex}
                dashboard={state.draft}
                onSelect={(contentIndex) => setContentTarget({ ...contentTarget, contentIndex })}
                tabIndex={contentTarget.tabIndex}
              />
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

      <ContentWizard
        dashboard={state.draft}
        onClose={() => setContentWizardTab(undefined)}
        onComplete={completeContent}
        open={contentWizardTab !== undefined}
        tabIndex={contentWizardTab ?? 0}
      />
    </>
  );
};
