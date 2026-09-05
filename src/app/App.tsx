import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import { ChartPanel } from "@/components/charts/ChartPanel";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { DataTable } from "@/components/tables/DataTable";
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
  return <Dashboard dashboard={dashboardResult.data} />;
};

const Dashboard = ({ dashboard }: { dashboard: DashboardSchema }) => {
  const [params, setParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(dashboard.controls.map((control) => [control.key, control.defaultValue])),
  );
  const analysis = useQuery({
    queryKey: ["analysis", params],
    queryFn: () => executeAnalysis(params),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  return (
    <main className="mx-auto w-[min(1120px,calc(100%-2.5rem))] py-16 max-sm:w-[calc(100%-1.5rem)] max-sm:py-9">
      <header className="mb-12 flex items-start justify-between gap-8 max-sm:flex-col">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.15em] text-stone-500">
            PHASE 2 · VERTICAL SLICE
          </p>
          <h1 className="text-7xl font-bold tracking-[-0.06em] max-sm:text-5xl">
            {dashboard.title}
          </h1>
          <p className="mt-5 text-lg text-stone-600">{dashboard.description}</p>
        </div>
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-sm text-stone-600">
          <i
            className={clsx(
              "h-2 w-2 rounded-full",
              analysis.isPending
                ? "animate-pulse bg-amber-500"
                : analysis.isError
                  ? "bg-red-600"
                  : "bg-emerald-600 shadow-[0_0_0_4px_#dcece4]",
            )}
          />
          {analysis.isPending
            ? "Pythonを準備中"
            : analysis.isError
              ? "実行エラー"
              : "オフライン実行中"}
        </span>
      </header>

      <ControlPanel
        controls={dashboard.controls}
        params={params}
        onChange={(key, value) => setParams((current) => ({ ...current, [key]: value }))}
      />

      {analysis.isError ? (
        <section className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900">
          <strong>Pythonの実行に失敗しました</strong>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">
            {analysis.error.message}
          </pre>
        </section>
      ) : analysis.data ? (
        <>
          <section className="my-4 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <article className="flex flex-col gap-3 rounded-2xl bg-stone-800 p-6 text-white">
              <span className="text-sm opacity-60">売上</span>
              <strong className="text-4xl tracking-tight">
                {currency.format(analysis.data.metrics.revenue)}
              </strong>
            </article>
            <article className="flex flex-col gap-3 rounded-2xl bg-emerald-100 p-6">
              <span className="text-sm opacity-60">注文件数</span>
              <strong className="text-4xl tracking-tight">
                {analysis.data.metrics.orders.toLocaleString("ja-JP")}
              </strong>
            </article>
          </section>

          <div className="grid gap-4">
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

          <p className="mt-4 text-right text-xs text-stone-500">
            Python {analysis.data.runtime.python} · pandas {analysis.data.runtime.pandas} · NumPy{" "}
            {analysis.data.runtime.numpy}
          </p>
        </>
      ) : (
        <section className="mt-4 grid h-72 place-items-center rounded-2xl border border-stone-300 bg-white/70 text-sm text-stone-500">
          WASMと分析データを読み込んでいます…
        </section>
      )}
    </main>
  );
};

export default App;
