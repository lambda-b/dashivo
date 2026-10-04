import { useRef, useState } from "react";
import { FileCode2, Plus, Trash2, Upload } from "lucide-react";
import { useQuery } from "@dashlet/shared-lib/query";
import { useDashboardId, useSavedDashboard } from "@/app/context/useDashboard";
import { useDefinitionActions } from "@/builder/hooks/useDefinitionActions";
import { loadAssetCatalog } from "@/api/python";
import { LogicDialog } from "@/builder/workbench/definitions/LogicDialog";
import { SelectList } from "@/components/primitives/SelectList";
import { IconButton } from "@/components/primitives/IconButton";
import { messages } from "@/messages";
import type { DashboardSchema } from "@shared/dashboard";

const getLogicDeletionDisabledReason = (
  dashboard: DashboardSchema,
  selected: string | undefined,
  saving: boolean,
) => {
  const usedTabs = dashboard.tabs.filter((tab) =>
    tab.contents.some((content) => content.logic === selected),
  );

  if (usedTabs.length) return messages.logic.deletionInUse(usedTabs.map((tab) => tab.label));
  if (saving) return messages.logic.deletionWhileSaving;
  return "";
};

export const Definitions = ({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (id: string) => void;
}) => {
  const dashboard = useSavedDashboard();
  const dashboardId = useDashboardId();
  const [adding, setAdding] = useState(false);
  const { updateInput, removeInput, removeLogic, registerCsv, isPending, isRegisteringCsv } =
    useDefinitionActions();
  const fileInput = useRef<HTMLInputElement>(null);

  const catalog = useQuery({
    meta: { errorMessage: messages.assets.loadFailed },
    queryKey: ["dashboard-assets", dashboardId],
    queryFn: () => loadAssetCatalog(dashboardId),
  });
  const deletionDisabledReason = getLogicDeletionDisabledReason(dashboard, selected, isPending);

  return (
    <aside className="min-h-0 overflow-y-auto border-r border-stone-200 bg-stone-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2 className="text-xs font-bold text-stone-700">ロジック定義</h2>
        <IconButton
          icon={Plus}
          label="ロジックを追加"
          disabled={!catalog.data || isPending}
          onClick={() => setAdding(true)}
        />
      </div>
      {dashboard.analysis.logic.map((logic) => (
        <button
          key={logic.id}
          aria-pressed={logic.id === selected}
          onClick={() => onSelect(logic.id)}
          className="aria-pressed:border-brand/30 aria-pressed:bg-brand-soft aria-pressed:text-brand-dark mb-1 block w-full cursor-pointer rounded-lg border border-transparent px-3 py-2.5 text-left hover:bg-white"
        >
          <span className="flex items-center gap-2">
            <FileCode2 aria-hidden="true" className="size-3.5 shrink-0" />
            <strong className="min-w-0 break-all font-mono text-xs">{logic.id}</strong>
          </span>
          <span className="mt-1 block break-all pl-5 font-mono text-[0.625rem] text-stone-400">
            {logic.path}
          </span>
        </button>
      ))}
      {selected && (
        <div>
          <IconButton
            icon={Trash2}
            variant="danger"
            label="選択中の定義を削除"
            disabled={!!deletionDisabledReason}
            onClick={() => removeLogic(selected)}
          />
          {deletionDisabledReason && (
            <p className="mt-2 px-1 text-xs leading-5 text-stone-500">{deletionDisabledReason}</p>
          )}
        </div>
      )}
      <h3 className="mb-3 mt-5 border-t border-stone-200 px-1 pt-4 text-xs font-bold text-stone-600">
        入力CSV
      </h3>
      {dashboard.analysis.inputs.map((input, index) => (
        <div
          className="mb-3 grid min-w-0 grid-cols-1 gap-2 rounded-lg border border-stone-200 bg-white p-3"
          key={input.id}
        >
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
            <input
              disabled={isPending}
              aria-label="Input ID"
              className="focus:border-brand min-w-0 w-full rounded-md border border-stone-300 px-2 py-1.5 font-mono text-xs outline-none"
              defaultValue={input.id}
              onBlur={(event) => {
                if (event.target.value !== input.id) updateInput(index, { id: event.target.value });
              }}
            />
            <IconButton
              icon={Trash2}
              variant="danger"
              label={`${input.id}を削除`}
              disabled={isPending}
              onClick={() => removeInput(index)}
            />
          </div>
          <SelectList
            disabled={isPending}
            ariaLabel="CSVファイル"
            value={input.path}
            onChange={(path) => updateInput(index, { path })}
            options={[...new Set([input.path, ...(catalog.data?.csv ?? [])])].map((path) => ({
              label: path,
              value: path,
            }))}
          />
        </div>
      ))}
      <input
        ref={fileInput}
        aria-label="アップロードするCSVファイル"
        accept=".csv,text/csv"
        className="sr-only"
        disabled={isPending}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) registerCsv(file);
        }}
        type="file"
      />
      <button
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-stone-300 px-2 py-2 text-xs font-semibold text-stone-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        disabled={isPending}
        onClick={() => fileInput.current?.click()}
        type="button"
      >
        <Upload aria-hidden="true" className="size-3.5" />
        {isRegisteringCsv ? "CSVを登録中…" : "CSVをアップロード"}
      </button>
      {adding && (
        <LogicDialog
          files={catalog.data?.python ?? []}
          onClose={() => {
            setAdding(false);
            void catalog.refetch();
          }}
          onCreated={onSelect}
        />
      )}
    </aside>
  );
};
