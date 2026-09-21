import { FileCode2 } from "lucide-react";
import { useDashboard } from "@/app/context/useDashboard";
import { EditButton } from "@/components/primitives/EditButton";
export const LogicArea = ({ onEditAnalysis }: { onEditAnalysis: () => void }) => {
  const dashboard = useDashboard();
  return (
    <aside className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex h-12 items-center justify-between border-b border-stone-100 px-4 text-xs font-semibold text-stone-600">
        <div className="flex items-center gap-2">
          <FileCode2 aria-hidden="true" className="size-3.5" />
          <span>Pythonロジック</span>
        </div>
        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[0.625rem] text-stone-500">
          {dashboard.analysis.logic.length}
        </span>
      </div>
      <div className="grid gap-2 p-4">
        {dashboard.analysis.logic.map((logic) => (
          <div className="min-w-0 rounded-md bg-stone-50 px-3 py-2" key={logic.id}>
            <strong className="block truncate font-mono text-xs text-stone-700">{logic.id}</strong>
            <span className="mt-0.5 block truncate font-mono text-[0.625rem] text-stone-400">
              {logic.path}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-100 p-3">
        <EditButton fullWidth onClick={onEditAnalysis}>
          Pythonロジックを管理
        </EditButton>
      </div>
    </aside>
  );
};
