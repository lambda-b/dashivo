import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createContentPlacement } from "@/builder/settings/hooks/useContentActions";
import { IconButton } from "@/components/primitives/IconButton";
import type { ContentPlacementDefinition, DashboardSchema } from "@/schema/dashboard";

export interface ContentPickerResult {
  content: ContentPlacementDefinition;
}

interface ContentPickerDialogProps {
  dashboard: DashboardSchema;
  onClose: () => void;
  onComplete: (result: ContentPickerResult) => Promise<void>;
  open: boolean;
  tabIndex: number;
}

export const ContentPickerDialog = ({
  dashboard,
  onClose,
  onComplete,
  open,
  tabIndex,
}: ContentPickerDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedLogicId, setSelectedLogicId] = useState(dashboard.analysis.logic[0]?.id);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!dashboard.analysis.logic.some((logic) => logic.id === selectedLogicId)) {
      setSelectedLogicId(dashboard.analysis.logic[0]?.id);
    }
  }, [dashboard.analysis.logic, selectedLogicId]);

  const close = () => {
    setError(undefined);
    setSaving(false);
    onClose();
  };

  const finish = async () => {
    if (!selectedLogicId) return;
    setSaving(true);
    setError(undefined);
    try {
      await onComplete({ content: createContentPlacement(dashboard, selectedLogicId) });
      close();
    } catch (cause) {
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "コンテンツを追加できませんでした。");
    }
  };

  return (
    <dialog
      aria-labelledby="content-wizard-title"
      className="m-auto w-[min(48rem,calc(100%-2rem))] rounded-2xl border border-stone-200 bg-white p-0 text-stone-800 shadow-2xl backdrop:bg-stone-950/45"
      onClose={close}
      ref={dialogRef}
    >
      <header className="flex items-start justify-between gap-6 border-b border-stone-200 px-7 py-5">
        <div>
          <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">SELECT OUTPUT</p>
          <h2 className="mt-1 text-xl font-bold" id="content-wizard-title">
            コンテンツを追加
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Python画面で定義済みの出力を「{dashboard.tabs[tabIndex]?.label}」へ配置します。
          </p>
        </div>
        <IconButton icon={X} label="コンテンツ追加を閉じる" onClick={close} />
      </header>

      <div className="max-h-[60vh] overflow-y-auto p-7">
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
      </div>

      <footer className="flex items-center justify-between border-t border-stone-200 px-7 py-4">
        {error ? <span className="text-xs text-red-700">{error}</span> : <span />}
        <button
          className="bg-brand hover:bg-brand-dark cursor-pointer rounded-md px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!selectedLogicId || saving}
          onClick={finish}
          type="button"
        >
          {saving ? "追加中…" : "コンテンツを追加"}
        </button>
      </footer>
    </dialog>
  );
};
