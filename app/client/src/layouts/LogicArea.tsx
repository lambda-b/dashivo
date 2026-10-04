import { Panel } from "@/components/primitives/Panel";

import { FileCode2 } from "lucide-react";
import { useDashboard } from "@/app/context/useDashboard";
import { EditButton } from "@/components/primitives/EditButton";

export const LogicArea = ({ onEditAnalysis }: { onEditAnalysis: () => void }) => {
  const dashboard = useDashboard();

  return (
    <Panel
      title="Pythonロジック"
      icon={FileCode2}
      count={dashboard.analysis.logic.length}
      footer={
        <EditButton className="w-full" onClick={onEditAnalysis}>
          Pythonロジックを管理
        </EditButton>
      }
    >
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
    </Panel>
  );
};
