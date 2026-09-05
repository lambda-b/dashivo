import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import { DashboardBuilder } from "@/builder/DashboardBuilder";
import { ChartPanel } from "@/components/charts/ChartPanel";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { DataTable } from "@/components/tables/DataTable";
import { validateDatasetBindings } from "@/runtime/bindings";
import { executeAnalysis } from "@/runtime/python-worker";
import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";
import dashboardSource from "#dashboard/dashboard.json";

const dashboardResult = dashboardSchema.safeParse(dashboardSource);
const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

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
        {(dashboard, revision) => <Dashboard dashboard={dashboard} key={revision} />}
      </DashboardBuilder>
    );
  }

  return <Dashboard dashboard={dashboardResult.data} />;
};

const Dashboard = ({ dashboard }: { dashboard: DashboardSchema }) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [params, setParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(dashboard.controls.map((control) => [control.key, control.defaultValue])),
  );
  const analysis = useQuery({
    queryKey: ["analysis", params],
    queryFn: () => executeAnalysis(params),
    select: (result) => validateDatasetBindings(dashboard, result),
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
      </header>

      <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
        <div className="flex flex-col items-start gap-5 lg:flex-row">
          <aside
            className={clsx(
              "shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-[width] duration-200 ease-out lg:sticky lg:top-5 lg:self-start",
              filtersOpen ? "w-full lg:w-60" : "w-14",
            )}
            id="dashboard-filters"
          >
            <button
              aria-controls="dashboard-filter-controls"
              aria-expanded={filtersOpen}
              aria-label={`絞り込みを${filtersOpen ? "隠す" : "表示"}`}
              className={clsx(
                "flex h-12 cursor-pointer items-center text-xs font-semibold text-stone-600 transition hover:bg-stone-50",
                filtersOpen ? "w-60 justify-between px-4" : "w-14 justify-center gap-1",
              )}
              onClick={() => setFiltersOpen((current) => !current)}
              type="button"
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 16 16">
                  <path
                    d="M2 3h12L9.5 8v3.5l-3 1.5V8L2 3Z"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="1.4"
                  />
                </svg>
                {filtersOpen && (
                  <>
                    <span>表示条件</span>
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[0.625rem] text-stone-500">
                      {dashboard.controls.length}
                    </span>
                  </>
                )}
              </div>
              <svg
                aria-hidden="true"
                className={clsx("size-3 transition-transform", filtersOpen && "rotate-180")}
                fill="none"
                viewBox="0 0 12 12"
              >
                <path
                  d="m4.5 2.5 3.5 3.5-3.5 3.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>

            {filtersOpen && (
              <div className="w-60 border-t border-stone-100 p-5" id="dashboard-filter-controls">
                <p className="mb-5 text-xs leading-5 text-stone-400">
                  ダッシュボード全体へ適用します
                </p>
                <ControlPanel
                  controls={dashboard.controls}
                  params={params}
                  onChange={(key, value) => setParams((current) => ({ ...current, [key]: value }))}
                />
              </div>
            )}
          </aside>

          <div className="min-w-0 flex-1">
            {analysis.isError ? (
              <section className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-900">
                <strong>Pythonの実行に失敗しました</strong>
                <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">
                  {analysis.error.message}
                </pre>
              </section>
            ) : analysis.data ? (
              <>
                <section className="mb-5 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <article className="flex flex-col gap-2 rounded-xl bg-stone-800 p-5 text-white shadow-sm">
                    <span className="text-xs font-medium uppercase tracking-wide opacity-55">
                      売上
                    </span>
                    <strong className="text-3xl tracking-tight">
                      {currency.format(analysis.data.metrics.revenue)}
                    </strong>
                  </article>
                  <article className="border-brand/20 bg-brand-soft flex flex-col gap-2 rounded-xl border p-5 shadow-sm">
                    <span className="text-brand-dark/60 text-xs font-medium uppercase tracking-wide">
                      注文件数
                    </span>
                    <strong className="text-3xl tracking-tight">
                      {analysis.data.metrics.orders.toLocaleString("ja-JP")}
                    </strong>
                  </article>
                </section>

                <div className="grid gap-5">
                  {dashboard.visualizations.map((visualization) => (
                    <ChartPanel
                      data={analysis.data.datasets[visualization.dataset] ?? []}
                      definition={visualization}
                      key={`${visualization.type}-${visualization.dataset}`}
                    />
                  ))}
                  {dashboard.tables.map((table) => (
                    <DataTable
                      data={analysis.data.datasets[table.dataset] ?? []}
                      definition={table}
                      key={table.dataset}
                    />
                  ))}
                </div>

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
    </main>
  );
};

export default App;
