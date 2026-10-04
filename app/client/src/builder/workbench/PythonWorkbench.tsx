import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useSavedDashboard } from "@/app/context/useDashboard";
import { loadPythonSource } from "@/api/python";
import { Definitions } from "@/builder/workbench/definitions/Definitions";
import { CodeWorkspace } from "@/builder/workbench/code/CodeWorkspace";
import { useDashboardId } from "@/app/context/useDashboard";
import { QueryBoundary } from "@/components/feedback/QueryBoundary";
import { messages } from "@/messages";

const PythonSource = ({ logicId, path }: { logicId: string; path: string }) => {
  const dashboardId = useDashboardId();
  const { data } = useSuspenseQuery({
    queryKey: ["python-source", dashboardId, path],
    queryFn: () => loadPythonSource(dashboardId, path),
    meta: { errorMessage: messages.logic.loadFailed, errorBoundary: true },
  });

  return <CodeWorkspace key={logicId} path={path} savedSource={data} />;
};

export const PythonWorkbench = ({ logicId }: { logicId?: string }) => {
  const dashboard = useSavedDashboard();
  const dashboardId = useDashboardId();
  const navigate = useNavigate();
  const location = useLocation();

  const logic = dashboard.analysis.logic.find((logic) => logic.id === logicId);

  const back = (location.state as { returnTo?: string } | null)?.returnTo ?? `/d/${dashboardId}`;

  return (
    <div className="animate-workbench-in fixed inset-0 z-50 flex flex-col overflow-hidden bg-white text-stone-800 shadow-2xl motion-reduce:animate-none">
      <header className="flex items-start justify-between gap-6 border-b border-stone-200 p-5">
        <div>
          <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">
            DEVELOPMENT ONLY
          </p>
          <h1 className="mt-1 text-xl font-bold">Python Workbench</h1>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Pythonコードと最終的な出力イメージを同じ画面で確認します。
          </p>
        </div>
        <button
          className="cursor-pointer rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
          onClick={() => navigate(back)}
        >
          Dashboardへ戻る
        </button>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)]">
        <Definitions
          selected={logic?.id}
          onSelect={(id) =>
            navigate(`/d/${dashboardId}/builder/python/${id}`, { state: { returnTo: back } })
          }
        />
        {logic ? (
          <QueryBoundary key={logic.id} errorMessage={messages.logic.loadFailed}>
            <PythonSource logicId={logic.id} path={logic.path} />
          </QueryBoundary>
        ) : (
          <p className="grid h-full place-items-center p-5 text-sm text-stone-500">
            ロジックを選択または追加してください。
          </p>
        )}
      </div>
    </div>
  );
};
