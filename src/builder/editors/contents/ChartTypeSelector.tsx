import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EditButton } from "@/components/primitives/EditButton";
import { IconButton } from "@/components/primitives/IconButton";
import type { ChartContentDefinition } from "@/schema/dashboard";

type ChartType = ChartContentDefinition["chart"]["type"];

interface ChartTypeSelectorProps {
  onChange: (type: ChartType) => void;
  value: ChartType;
}

interface ChartTypeOption {
  description: string;
  label: string;
  type: ChartType;
}

const chartTypes = [
  { type: "line", label: "折れ線グラフ", description: "時系列や連続した値の変化を表示します。" },
  { type: "bar", label: "棒グラフ", description: "項目ごとの値や大小を比較します。" },
  { type: "pie", label: "円グラフ", description: "全体に占める各項目の割合を表示します。" },
  { type: "scatter", label: "散布図", description: "2つの数値の関係や分布を表示します。" },
] as const satisfies ReadonlyArray<ChartTypeOption>;

const ChartPreview = ({ type }: { type: ChartType }) => {
  switch (type) {
    case "line":
      return (
        <svg aria-hidden="true" className="h-16 w-full" viewBox="0 0 160 64">
          <path d="M8 54H152M8 8V54" fill="none" stroke="#d6d3d1" strokeWidth="1.5" />
          <polyline
            fill="none"
            points="10,46 40,35 70,40 100,18 130,25 150,10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      );
    case "bar":
      return (
        <svg aria-hidden="true" className="h-16 w-full" viewBox="0 0 160 64">
          <path d="M8 54H152M8 8V54" fill="none" stroke="#d6d3d1" strokeWidth="1.5" />
          <g fill="currentColor">
            <rect height="22" rx="2" width="22" x="24" y="32" />
            <rect height="36" rx="2" width="22" x="57" y="18" />
            <rect height="28" rx="2" width="22" x="90" y="26" />
            <rect height="44" rx="2" width="22" x="123" y="10" />
          </g>
        </svg>
      );
    case "pie":
      return (
        <svg aria-hidden="true" className="h-16 w-full" viewBox="0 0 160 64">
          <circle cx="80" cy="32" fill="#e7e5e4" r="25" />
          <path d="M80 32V7a25 25 0 0 1 21.65 37.5Z" fill="currentColor" />
          <path d="M80 32l21.65 12.5A25 25 0 0 1 58.35 44.5Z" fill="#fca5a5" />
        </svg>
      );
    case "scatter":
      return (
        <svg aria-hidden="true" className="h-16 w-full" viewBox="0 0 160 64">
          <path d="M8 54H152M8 8V54" fill="none" stroke="#d6d3d1" strokeWidth="1.5" />
          <g fill="currentColor">
            <circle cx="28" cy="44" r="4" />
            <circle cx="52" cy="35" r="4" />
            <circle cx="76" cy="40" r="4" />
            <circle cx="101" cy="21" r="4" />
            <circle cx="130" cy="16" r="4" />
          </g>
        </svg>
      );
  }
};

interface ChartTypeDialogProps extends ChartTypeSelectorProps {
  onClose: () => void;
  open: boolean;
}

const ChartTypeDialog = ({ onChange, onClose, open, value }: ChartTypeDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-labelledby="chart-type-dialog-title"
      className="m-auto w-[min(44rem,calc(100%-2rem))] rounded-xl border border-stone-200 bg-white p-0 text-stone-800 shadow-2xl backdrop:bg-stone-950/40"
      onClose={onClose}
      ref={dialogRef}
    >
      <header className="flex items-start justify-between gap-6 border-b border-stone-200 px-6 py-5">
        <div>
          <h3 className="text-lg font-bold" id="chart-type-dialog-title">
            チャートタイプを選択
          </h3>
          <p className="mt-1 text-sm text-stone-500">データの見せ方に合う形式を選びます。</p>
        </div>
        <IconButton icon={X} label="チャートタイプの選択を閉じる" onClick={onClose} />
      </header>

      <div className="grid gap-3 p-6 sm:grid-cols-2">
        {chartTypes.map((option) => {
          const selected = option.type === value;
          return (
            <button
              aria-pressed={selected}
              className="hover:border-brand hover:bg-brand-soft group relative cursor-pointer rounded-lg border border-stone-200 p-4 text-left transition"
              key={option.type}
              onClick={() => {
                onChange(option.type);
                onClose();
              }}
              type="button"
            >
              {selected && (
                <span className="bg-brand absolute top-3 right-3 grid size-5 place-items-center rounded-full text-white">
                  <Check aria-hidden="true" className="size-3" />
                </span>
              )}
              <div className="text-brand mb-3 rounded-md bg-stone-50 px-3">
                <ChartPreview type={option.type} />
              </div>
              <strong className="block text-sm">{option.label}</strong>
              <span className="mt-1 block text-xs leading-5 text-stone-500">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </dialog>
  );
};

export const ChartTypeSelector = ({ onChange, value }: ChartTypeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const selected = chartTypes.find((option) => option.type === value)!;

  return (
    <div className="grid gap-2 rounded-lg border border-stone-200 p-3">
      <div className="flex items-center gap-3">
        <div className="text-brand w-28 shrink-0 rounded-md bg-stone-50 px-2">
          <ChartPreview type={selected.type} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-stone-500">チャートタイプ</span>
          <strong className="mt-1 block text-sm text-stone-800">{selected.label}</strong>
        </div>
        <EditButton onClick={() => setOpen(true)} size="compact">
          変更
        </EditButton>
      </div>
      <ChartTypeDialog
        onChange={onChange}
        onClose={() => setOpen(false)}
        open={open}
        value={value}
      />
    </div>
  );
};
