import { SlidersHorizontal } from "lucide-react";
import { useDashboard } from "@/app/context/useDashboard";
import { EditButton } from "@/components/primitives/EditButton";
import { ControlPanel } from "@/components/controls/ControlPanel";
import type { ParameterValue } from "@/schema/dashboard";

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
    <aside className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
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
        <p className="mb-5 text-xs leading-5 text-stone-400">ダッシュボード全体へ適用します</p>
        <ControlPanel controls={dashboard.controls} params={params} onChange={onChange} />
      </div>

      {onEditParameters && (
        <div className="grid gap-2 border-t border-stone-100 p-3">
          <EditButton fullWidth onClick={onEditParameters}>
            パラメータを編集
          </EditButton>
        </div>
      )}
    </aside>
  );
};
