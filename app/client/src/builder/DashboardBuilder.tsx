import { Button } from "@/components/primitives/Button";
import { IconButton } from "@/components/primitives/IconButton";
import { X } from "lucide-react";

import { useState, type ReactNode } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  DashboardPreviewContext,
  useSavedDashboard,
  useDashboardId,
} from "@/app/context/useDashboard";
import { useDownloadDashboard } from "@/builder/hooks/useDownloadDashboard";
import { useSettingsEditor } from "@/builder/settings/hooks/useSettingsEditor";
import { useContentActions } from "@/builder/settings/hooks/useContentActions";
import { useParameterActions } from "@/builder/settings/hooks/useParameterActions";
import { HeaderSetting } from "@/builder/settings/HeaderSetting";
import { ControlSetting } from "@/builder/settings/ControlSetting";
import { ContentSetting } from "@/builder/settings/ContentSetting";
import { TabSetting } from "@/builder/settings/TabSetting";
import { ContentPickerDialog } from "@/builder/settings/components/ContentPickerDialog";
import { PythonWorkbench } from "@/builder/workbench/PythonWorkbench";

export interface BuilderActions {
  addContent: (tabIndex: number) => void;
  download: () => void;
  downloadPending: boolean;
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
  const dashboardId = useDashboardId();
  const {
    draft,
    update,
    preview,
    addContent,
    applyPreview,
    saveSettings,
    resetSettings,
    validationError,
    isPending,
    isSuccess,
  } = useSettingsEditor();
  const [section, setSection] = useState<Section>();
  const [target, setTarget] = useState<{ tabIndex: number; contentIndex?: number }>({
    tabIndex: 0,
  });
  const [addingTab, setAddingTab] = useState<number>();

  const navigate = useNavigate();
  const location = useLocation();
  const route = matchPath("/d/:dashboardId/builder/python/:logicId?", location.pathname);

  const contentActions = useContentActions(draft, update);
  const parameterActions = useParameterActions(draft, update);

  const download = useDownloadDashboard();

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
            download: download.download,
            downloadPending: download.isPending,
            editContent: (tabIndex, contentIndex) => {
              setTarget({ tabIndex, contentIndex });
              setSection("contents");
            },
            openAnalysis: () =>
              navigate(`/d/${dashboardId}/builder/python/${saved.analysis.logic[0]?.id ?? ""}`, {
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
            <IconButton icon={X} label="Builderを閉じる" onClick={() => setSection(undefined)} />
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
            {validationError && (
              <pre role="alert" className="whitespace-pre-wrap text-xs text-red-700">
                {validationError}
              </pre>
            )}
          </div>
          <footer className="flex flex-wrap justify-between gap-3 border-t p-5">
            <Button onClick={resetSettings}>元に戻す</Button>
            <Button pending={isPending} onClick={saveSettings}>
              dashboard.jsonを保存
            </Button>
            {isSuccess && <span>保存しました</span>}
            <Button variant="primary" onClick={applyPreview}>
              プレビューへ反映
            </Button>
          </footer>
        </aside>
      )}
      {addingTab !== undefined && !route && (
        <ContentPickerDialog
          dashboard={draft}
          open
          tabIndex={addingTab}
          onClose={() => setAddingTab(undefined)}
          error={validationError}
          onComplete={(logicId) => addContent(addingTab, logicId)}
        />
      )}
    </div>
  );
};
