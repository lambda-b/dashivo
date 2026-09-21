import { useState, type ReactNode } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  dashboardQueryKey,
  DashboardPreviewContext,
  useSavedDashboard,
} from "@/app/context/useDashboard";
import { loadDashboard, type DashboardSettings } from "@/builder/api/dashboard";
import { useSaveDashboard } from "@/builder/hooks/useSaveDashboard";
import { useSettingsDraft, settingsOf } from "@/builder/settings/hooks/useSettingsDraft";
import { useContentActions } from "@/builder/settings/hooks/useContentActions";
import { useParameterActions } from "@/builder/settings/hooks/useParameterActions";
import { HeaderSetting } from "@/builder/settings/HeaderSetting";
import { ControlSetting } from "@/builder/settings/ControlSetting";
import { ContentSetting } from "@/builder/settings/ContentSetting";
import { TabSetting } from "@/builder/settings/TabSetting";
import { ContentPickerDialog } from "@/builder/settings/components/ContentPickerDialog";
import { PythonWorkbench } from "@/builder/workbench/PythonWorkbench";
import { dashboardSchema } from "@/schema/dashboard";

export interface BuilderActions {
  addContent: (tabIndex: number) => void;
  editContent: (tabIndex: number, contentIndex: number) => void;
  openAnalysis: () => void;
  openHeader: () => void;
  openParameters: () => void;
  openTabs: () => void;
}
type Section = "header" | "parameters" | "contents" | "tabs";

const titles = {
  header: "ヘッダー設定",
  parameters: "パラメータ設定",
  contents: "コンテンツ設定",
  tabs: "タブ設定",
};

export const DashboardBuilder = ({
  children,
}: {
  children: (actions: BuilderActions) => ReactNode;
}) => {
  const saved = useSavedDashboard();
  const { draft, update, reset } = useSettingsDraft();
  const [preview, setPreview] = useState<DashboardSettings>();
  const [section, setSection] = useState<Section>();
  const [target, setTarget] = useState<{ tabIndex: number; contentIndex?: number }>({
    tabIndex: 0,
  });
  const [addingTab, setAddingTab] = useState<number>();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const route = matchPath("/builder/python/:logicId?", location.pathname);
  const contentActions = useContentActions(draft, update);
  const parameterActions = useParameterActions(draft, update);

  const save = useSaveDashboard();
  const loaded = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: loadDashboard,
    staleTime: Infinity,
    refetchOnMount: "always",
  });

  const apply = () => {
    try {
      setPreview(settingsOf(dashboardSchema.parse(draft)));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  return (
    <div>
      {route ? (
        <PythonWorkbench logicId={route.params.logicId} />
      ) : (
        <DashboardPreviewContext.Provider
          value={preview ? { ...preview, analysis: saved.analysis } : saved}
        >
          {children({
            addContent: setAddingTab,
            editContent: (tabIndex, contentIndex) => {
              setTarget({ tabIndex, contentIndex });
              setSection("contents");
            },
            openAnalysis: () =>
              navigate("/builder/python/" + (saved.analysis.logic[0]?.id ?? ""), {
                state: { returnTo: location.pathname },
              }),
            openHeader: () => setSection("header"),
            openParameters: () => setSection("parameters"),
            openTabs: () => setSection("tabs"),
          })}
        </DashboardPreviewContext.Provider>
      )}
      {!route && section && (
        <aside
          aria-label="Dashboard Builder"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l bg-white shadow-2xl"
        >
          <header className="flex justify-between border-b p-5">
            <h2 className="font-bold">{titles[section]}</h2>
            <button aria-label="Builderを閉じる" onClick={() => setSection(undefined)}>
              閉じる
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-auto p-5">
            {section === "header" ? (
              <HeaderSetting dashboard={draft} onChange={update} />
            ) : section === "parameters" ? (
              <ControlSetting actions={parameterActions} dashboard={draft} />
            ) : section === "contents" ? (
              <ContentSetting
                actions={contentActions}
                dashboard={draft}
                tabIndex={target.tabIndex}
                contentIndex={target.contentIndex}
                onSelect={(contentIndex) => setTarget({ ...target, contentIndex })}
              />
            ) : (
              <TabSetting dashboard={draft} onChange={update} />
            )}
            {(error || save.error || loaded.error) && (
              <pre role="alert" className="whitespace-pre-wrap text-xs text-red-700">
                {error || save.error?.message || loaded.error?.message}
              </pre>
            )}
          </div>
          <footer className="flex flex-wrap justify-between gap-3 border-t p-5">
            <button
              onClick={() => {
                reset();
                setPreview(undefined);
                setError("");
                save.reset();
              }}
            >
              元に戻す
            </button>
            <button
              disabled={save.isPending}
              onClick={() => save.mutate({ settings: settingsOf(draft) })}
            >
              dashboard.jsonを保存
            </button>
            {save.isSuccess && <span>保存しました</span>}
            <button className="rounded bg-red-700 p-2 text-white" onClick={apply}>
              プレビューへ反映
            </button>
          </footer>
        </aside>
      )}
      {addingTab !== undefined && !route && (
        <ContentPickerDialog
          dashboard={draft}
          open
          tabIndex={addingTab}
          onClose={() => setAddingTab(undefined)}
          onComplete={async ({ content }) => {
            const next = dashboardSchema.parse({
              ...draft,
              tabs: draft.tabs.map((tab, index) =>
                index === addingTab ? { ...tab, contents: [...tab.contents, content] } : tab,
              ),
            });
            update(next);
            setPreview(settingsOf(next));
          }}
        />
      )}
    </div>
  );
};
