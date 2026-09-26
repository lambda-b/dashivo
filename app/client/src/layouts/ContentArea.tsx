import { Navigate, Route, Routes } from "react-router-dom";
import { useDashboard } from "@/app/context/useDashboard";
import { DashboardContent } from "@/components/contents/DashboardContent";
import { DashboardTabs } from "@/components/contents/DashboardTabs";
import type { AnalysisResults } from "@shared/dashboard";

export const ContentArea = ({
  analysis,
  onEditTabs,
  onAddContent,
  onEditContent,
}: {
  analysis: { isError: boolean; data?: AnalysisResults; error: Error | null };
  onEditTabs?: () => void;
  onAddContent?: (tabIndex: number) => void;
  onEditContent?: (tabIndex: number, contentIndex: number) => void;
}) => {
  const dashboard = useDashboard();
  const defaultTabPath = "/" + dashboard.tabs[0].id;

  return (
    <div className="min-w-0 flex-1">
      <DashboardTabs onEditTabs={onEditTabs} tabs={dashboard.tabs} />

      <div className="mt-5">
        {analysis.isError ? (
          <section className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-900">
            <strong>Pythonの実行に失敗しました</strong>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">
              {analysis.error?.message}
            </pre>
          </section>
        ) : analysis.data ? (
          <Routes>
            <Route element={<Navigate replace to={defaultTabPath} />} path="/" />
            {dashboard.tabs.map((tab, tabIndex) => (
              <Route
                element={
                  <DashboardContent
                    analysis={dashboard.analysis}
                    onAddContent={onAddContent && (() => onAddContent(tabIndex))}
                    onEditContent={
                      onEditContent && ((contentIndex) => onEditContent(tabIndex, contentIndex))
                    }
                    results={analysis.data!}
                    tab={tab}
                  />
                }
                key={tab.id}
                path={`/${tab.id}`}
              />
            ))}
            <Route element={<Navigate replace to={defaultTabPath} />} path="*" />
          </Routes>
        ) : (
          <section className="grid h-72 place-items-center rounded-xl border border-stone-200 bg-white text-sm text-stone-500 shadow-sm">
            WASMと分析データを読み込んでいます…
          </section>
        )}
      </div>
    </div>
  );
};
