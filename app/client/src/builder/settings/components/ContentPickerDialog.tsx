import { useEffect, useState } from "react";
import { Dialog } from "@/components/primitives/Dialog";
import { Button } from "@/components/primitives/Button";
import type { DashboardSchema } from "@shared/dashboard";

interface ContentPickerDialogProps {
  dashboard: DashboardSchema;
  onClose: () => void;
  onComplete: (logicId: string) => boolean;
  error?: string;
  open: boolean;
  tabIndex: number;
}

export const ContentPickerDialog = ({
  dashboard,
  onClose,
  onComplete,
  error,
  open,
  tabIndex,
}: ContentPickerDialogProps) => {
  const [selectedLogicId, setSelectedLogicId] = useState(dashboard.analysis.logic[0]?.id);

  useEffect(() => {
    if (!dashboard.analysis.logic.some((logic) => logic.id === selectedLogicId)) {
      setSelectedLogicId(dashboard.analysis.logic[0]?.id);
    }
  }, [dashboard.analysis.logic, selectedLogicId]);

  const finish = () => {
    if (selectedLogicId && onComplete(selectedLogicId)) onClose();
  };

  return (
    <Dialog
      open={open}
      title="コンテンツを追加"
      size="large"
      eyebrow="SELECT OUTPUT"
      closeLabel="コンテンツ追加を閉じる"
      description={
        <>Python画面で定義済みの出力を「{dashboard.tabs[tabIndex]?.label}」へ配置します。</>
      }
      onClose={onClose}
      footer={
        <>
          {error && (
            <span role="alert" className="mr-auto whitespace-pre-wrap text-xs text-red-700">
              {error}
            </span>
          )}
          <Button disabled={!selectedLogicId} onClick={finish} size="regular" variant="primary">
            コンテンツを追加
          </Button>
        </>
      }
    >
      {dashboard.analysis.logic.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {dashboard.analysis.logic.map((logic) => (
            <label
              className={`cursor-pointer rounded-xl border p-4 transition ${
                selectedLogicId === logic.id
                  ? "border-brand bg-red-50 ring-1 ring-red-200"
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              }`}
              key={logic.id}
            >
              <input
                checked={selectedLogicId === logic.id}
                className="sr-only"
                name="content-output"
                onChange={() => setSelectedLogicId(logic.id)}
                type="radio"
              />
              <span className="text-[0.6875rem] font-bold tracking-wide text-stone-400">
                Python
              </span>
              <span className="mt-1 block text-sm font-bold text-stone-800">{logic.id}</span>
              <span className="mt-1 block truncate font-mono text-[0.6875rem] text-stone-400">
                {logic.path}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
          Python画面で出力を作成してからコンテンツを追加してください。
        </p>
      )}
    </Dialog>
  );
};
