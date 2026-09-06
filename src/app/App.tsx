import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardBuilder } from "@/builder/ui/DashboardBuilder";
import { EditButton } from "@/components/EditButton";
import { DashboardContent } from "@/components/contents/DashboardContent";
import { DashboardTabs } from "@/components/contents/DashboardTabs";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { analysisPort } from "@/ports/analysis";
import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";
import { validateContentBindings } from "@/schema/validation";
import dashboardSource from "#dashboard/dashboard.json";

const dashboardResult = dashboardSchema.safeParse(dashboardSource);

const App = () => {
  if (!dashboardResult.success) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <section className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900">
          <h1 className="text-xl font-bold">Dashboard Schemaが不正です</h1>
          <pre className="mt-4 overflow-auto whitespace-pre-wrap text-xs">
            {dashboardResult.error.message}
          </pre>
        </section>
      </main>
    );
  }
  if (import.meta.env.DEV) {
    return (
      <DashboardBuilder initialDashboard={dashboardResult.data}>
        {(dashboard, revision, actions) => (
          <Dashboard
            dashboard={dashboard}
            key={revision}
            onEditHeader={actions.openHeader}
            onEditParameters={actions.openParameters}
            onEditTabs={actions.openTabs}
          />
        )}
      </DashboardBuilder>
    );
  }

  return <Dashboard dashboard={dashboardResult.data} />;
};

interface DashboardProps {
  dashboard: DashboardSchema;
  onEditHeader?: () => void;
  onEditParameters?: () => void;
  onEditTabs?: () => void;
}

const Dashboard = ({ dashboard, onEditHeader, onEditParameters, onEditTabs }: DashboardProps) => {
  const defaultTabPath = `/${dashboard.tabs[0].id}`;
  const [params, setParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(dashboard.controls.map((control) => [control.key, control.defaultValue])),
  );
  const analysis = useQuery({
    queryKey: ["analysis", params],
    queryFn: () => analysisPort.execute(params),
    select: (result) => validateContentBindings(dashboard, result),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  return (
    <main className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white/85 px-5 py-6 backdrop-blur-sm sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-6 max-sm:flex-col">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="bg-brand grid size-7 place-items-center rounded-md text-[0.625rem] font-black text-white">
                D
              </span>
              <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">
                DASHLET{import.meta.env.DEV && " · BUILDER PREVIEW"}
              </p>
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              {dashboard.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
              {dashboard.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 max-sm:justify-start">
            {onEditHeader && <EditButton onClick={onEditHeader}>ヘッダーを編集</EditButton>}
            <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600">
              <i
                className={clsx(
                  "h-2 w-2 rounded-full",
                  analysis.isPending
                    ? "animate-pulse bg-amber-500"
                    : analysis.isError
                      ? "bg-red-600"
                      : "bg-emerald-600 shadow-[0_0_0_3px_#dcece4]",
                )}
              />
              {analysis.isPending
                ? "Pythonを準備中"
                : analysis.isError
                  ? "実行エラー"
                  : "オフライン実行中"}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
        <div className="grid items-start gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm lg:sticky lg:top-5">
            <div className="flex h-12 items-center justify-between border-b border-stone-100 px-4 text-xs font-semibold text-stone-600">
              <div className="flex items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="size-3.5" />
                <span>パラメータ</span>
              </div>
              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[0.625rem] text-stone-500">
                {dashboard.controls.length}
              </span>
            </div>

            <div className="p-5">
              <p className="mb-5 text-xs leading-5 text-stone-400">
                ダッシュボード全体へ適用します
              </p>
              <ControlPanel
                controls={dashboard.controls}
                params={params}
                onChange={(key, value) => setParams((current) => ({ ...current, [key]: value }))}
              />
            </div>

            {onEditParameters && (
              <div className="border-t border-stone-100 p-3">
                <EditButton className="w-full" onClick={onEditParameters}>
                  パラメータを編集
                </EditButton>
              </div>
            )}
          </aside>

          <div className="min-w-0 flex-1">
            <DashboardTabs onEdit={onEditTabs} tabs={dashboard.tabs} />

            <div className="mt-5">
              {analysis.isError ? (
                <section className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-900">
                  <strong>Pythonの実行に失敗しました</strong>
                  <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">
                    {analysis.error.message}
                  </pre>
                </section>
              ) : analysis.data ? (
                <>
                  <Routes>
                    <Route element={<Navigate replace to={defaultTabPath} />} path="/" />
                    {dashboard.tabs.map((tab) => (
                      <Route
                        element={<DashboardContent result={analysis.data} tab={tab} />}
                        key={tab.id}
                        path={`/${tab.id}`}
                      />
                    ))}
                    <Route element={<Navigate replace to={defaultTabPath} />} path="*" />
                  </Routes>

                  <p className="mt-5 text-right text-xs text-stone-500">
                    Python {analysis.data.runtime.python} · pandas {analysis.data.runtime.pandas} ·
                    NumPy {analysis.data.runtime.numpy}
                  </p>
                </>
              ) : (
                <section className="grid h-72 place-items-center rounded-xl border border-stone-200 bg-white text-sm text-stone-500 shadow-sm">
                  WASMと分析データを読み込んでいます…
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;
