import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useSavedDashboard } from "@/app/context/useDashboard";
import { loadPythonSource } from "@/builder/api/python";
import { Definitions } from "@/builder/workbench/definitions/Definitions";
import { CodeWorkspace } from "@/builder/workbench/code/CodeWorkspace";
export const PythonWorkbench = ({ logicId }: { logicId?: string }) => {
  const dashboard = useSavedDashboard();
  const navigate = useNavigate();
  const location = useLocation();
  const logic = dashboard.analysis.logic.find((logic) => logic.id === logicId);
  const source = useQuery({
    queryKey: ["python-source", logic?.path],
    enabled: !!logic,
    queryFn: () => loadPythonSource(logic!.path),
  });
  const back =
    (location.state as { returnTo?: string } | null)?.returnTo ?? "/" + dashboard.tabs[0].id;
  return (
    <div className="animate-workbench-in fixed inset-0 z-50 flex flex-col bg-white motion-reduce:animate-none">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="font-bold">Python Workbench</h1>
        <button onClick={() => navigate(back)}>Dashboardへ戻る</button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)]">
        <Definitions
          selected={logic?.id}
          onSelect={(id) => navigate("/builder/python/" + id, { state: { returnTo: back } })}
        />
        {logic && source.data !== undefined ? (
          <CodeWorkspace key={logic.id} path={logic.path} savedSource={source.data} />
        ) : (
          <p className="p-4">
            {source.error?.message ??
              (source.isFetching ? "読み込み中…" : "ロジックを選択または追加してください。")}
          </p>
        )}
      </div>
    </div>
  );
};
