import { ChevronDown, Plus } from "lucide-react";
import { Dialog } from "@/components/primitives/Dialog";
import type { ControlDefinition } from "@shared/dashboard";

type ControlType = ControlDefinition["type"];

interface ControlCatalogDialogProps {
  onAdd: (type: ControlType) => void;
  onClose: () => void;
  open: boolean;
}

interface CatalogItem {
  description: string;
  label: string;
  technicalName: string;
  type: ControlType;
}

const catalog = [
  {
    type: "radio",
    label: "単一選択（ボタン）",
    technicalName: "Radio",
    description: "少数の候補を並べ、どれか一つを選択します。",
  },
  {
    type: "select",
    label: "単一選択（リスト）",
    technicalName: "Select",
    description: "候補をリストにまとめ、どれか一つを選択します。",
  },
  {
    type: "checkbox",
    label: "複数選択",
    technicalName: "Checkbox",
    description: "複数の候補を、それぞれオンまたはオフにします。",
  },
  {
    type: "date-range",
    label: "日付範囲",
    technicalName: "Date Range",
    description: "開始日と終了日を指定します。",
  },
  {
    type: "slider",
    label: "数値スライダー",
    technicalName: "Slider",
    description: "範囲内の数値を、単一または複数のつまみで指定します。",
  },
] as const satisfies ReadonlyArray<CatalogItem>;

const ControlPreview = ({ type }: { type: ControlType }) => {
  switch (type) {
    case "radio":
      return (
        <div className="flex gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="border-brand grid size-4 place-items-center rounded-full border">
              <span className="bg-brand size-2 rounded-full" />
            </span>
            選択肢A
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-4 rounded-full border border-stone-300" />
            選択肢B
          </span>
        </div>
      );
    case "select":
      return (
        <div className="flex h-9 items-center justify-between rounded-md border border-stone-300 bg-white px-3 text-xs text-stone-500">
          選択肢1
          <ChevronDown aria-hidden="true" className="size-3.5" />
        </div>
      );
    case "checkbox":
      return (
        <div className="flex gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="size-4 rounded-sm border border-stone-400 bg-white" />
            選択肢A
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-4 rounded-sm border border-stone-400 bg-white" />
            選択肢B
          </span>
        </div>
      );
    case "date-range":
      return (
        <div className="grid grid-cols-2 gap-2 text-[0.625rem] text-stone-500">
          <span>
            <span className="mb-1 block">開始日</span>
            <span className="block rounded-md border border-stone-300 bg-white px-2 py-2">
              年/月/日
            </span>
          </span>
          <span>
            <span className="mb-1 block">終了日</span>
            <span className="block rounded-md border border-stone-300 bg-white px-2 py-2">
              年/月/日
            </span>
          </span>
        </div>
      );
    case "slider":
      return (
        <div className="flex h-9 items-center px-1">
          <span className="relative block h-2 w-full rounded-full bg-stone-200">
            <span className="bg-brand absolute left-1/4 right-1/4 h-full rounded-full" />
            <span className="border-brand absolute left-1/4 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white" />
            <span className="border-brand absolute right-1/4 top-1/2 size-4 translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white" />
          </span>
        </div>
      );
  }
};

export const ControlCatalogDialog = ({ open, onAdd, onClose }: ControlCatalogDialogProps) => {
  return (
    <Dialog
      open={open}
      title="入力項目を追加"
      closeLabel="入力項目の選択を閉じる"
      description="画面表示ロジックへ渡す値の入力方法を選びます。"
      onClose={onClose}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {catalog.map((item) => (
          <button
            aria-label={`${item.label}を追加`}
            className="hover:border-brand hover:bg-brand-soft group cursor-pointer rounded-lg border border-stone-200 p-4 text-left transition"
            key={item.type}
            onClick={() => {
              onAdd(item.type);
              onClose();
            }}
            type="button"
          >
            <div className="mb-4 rounded-md bg-stone-50 p-3">
              <ControlPreview type={item.type} />
            </div>
            <span className="flex items-center justify-between gap-3">
              <span>
                <strong className="block text-sm">{item.label}</strong>
                <small className="mt-0.5 block text-[0.6875rem] font-semibold tracking-wide text-stone-400">
                  {item.technicalName}
                </small>
              </span>
              <Plus
                aria-hidden="true"
                className="group-hover:text-brand size-4 shrink-0 text-stone-400"
              />
            </span>
            <span className="mt-2 block text-xs leading-5 text-stone-500">{item.description}</span>
          </button>
        ))}
      </div>
    </Dialog>
  );
};
