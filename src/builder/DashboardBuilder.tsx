import { useState, type ReactNode } from "react";
import { parseDashboardJson, serializeDashboard } from "@/builder/schema";
import type { DashboardSchema } from "@/schema/dashboard";

interface DashboardBuilderProps {
  initialDashboard: DashboardSchema;
  children: (dashboard: DashboardSchema, revision: number) => ReactNode;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Dashboard Schemaを読み込めませんでした。";

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

export const DashboardBuilder = ({ initialDashboard, children }: DashboardBuilderProps) => {
  const initialSource = serializeDashboard(initialDashboard);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [source, setSource] = useState(initialSource);
  const [revision, setRevision] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();

  const applySource = () => {
    try {
      const nextDashboard = parseDashboardJson(source);
      setDashboard(nextDashboard);
      setSource(serializeDashboard(nextDashboard));
      setRevision((current) => current + 1);
      setError(undefined);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  };

  const resetSource = () => {
    setDashboard(initialDashboard);
    setSource(initialSource);
    setRevision((current) => current + 1);
    setError(undefined);
  };

  const saveSource = () => {
    try {
      const nextDashboard = parseDashboardJson(source);
      setSource(serializeDashboard(nextDashboard));
      setError(undefined);
      downloadDashboard(nextDashboard);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  };

  return (
    <>
      {children(dashboard, revision)}

      {isOpen ? (
        <aside
          aria-label="Dashboard Builder"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-stone-300 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-6 border-b border-stone-200 p-5">
            <div>
              <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-[#7248b9]">
                DEVELOPMENT ONLY
              </p>
              <h2 className="mt-1 text-xl font-bold">Dashboard Builder</h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Schemaを検証してプレビューへ反映します。
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

          <div className="flex min-h-0 flex-1 flex-col p-5">
            <label className="mb-2 text-xs font-semibold text-stone-600" htmlFor="dashboard-schema">
              dashboard.json
            </label>
            <textarea
              className="min-h-0 flex-1 resize-none rounded-lg border border-stone-300 bg-stone-950 p-4 font-mono text-xs leading-5 text-stone-100 outline-none focus:border-[#7248b9] focus:ring-2 focus:ring-[#7248b9]/20"
              id="dashboard-schema"
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              value={source}
            />
            {error && (
              <pre
                className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs text-red-800"
                role="alert"
              >
                {error}
              </pre>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 p-5">
            <div className="flex gap-2">
              <button
                className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                onClick={resetSource}
                type="button"
              >
                元に戻す
              </button>
              <button
                className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                onClick={saveSource}
                type="button"
              >
                JSONを保存
              </button>
            </div>
            <button
              className="cursor-pointer rounded-md bg-[#7248b9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5c359e]"
              onClick={applySource}
              type="button"
            >
              プレビューへ反映
            </button>
          </footer>
        </aside>
      ) : (
        <button
          className="fixed right-5 bottom-5 z-50 cursor-pointer rounded-full bg-[#7248b9] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#5c359e]"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Builderを開く
        </button>
      )}
    </>
  );
};
