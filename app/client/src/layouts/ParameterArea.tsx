import { Panel } from "@/components/primitives/Panel";

import { SlidersHorizontal } from "lucide-react";
import { useDashboard } from "@/app/context/useDashboard";
import { EditButton } from "@/components/primitives/EditButton";
import { ControlPanel } from "@/components/controls/ControlPanel";
import type { ParameterValue } from "@shared/dashboard";

export const ParameterArea = ({
  params,
  onChange,
  onEditParameters,
}: {
  params: Record<string, ParameterValue>;
  onChange: (key: string, value: ParameterValue) => void;
  onEditParameters?: () => void;
}) => {
  const dashboard = useDashboard();

  return (
    <Panel
      title="パラメータ"
      icon={SlidersHorizontal}
      count={dashboard.controls.length}
      footer={
        onEditParameters && (
          <EditButton className="w-full" onClick={onEditParameters}>
            パラメータを編集
          </EditButton>
        )
      }
    >
      <div className="p-5">
        <p className="mb-5 text-xs leading-5 text-stone-400">ダッシュボード全体へ適用します</p>
        <ControlPanel controls={dashboard.controls} params={params} onChange={onChange} />
      </div>
    </Panel>
  );
};
