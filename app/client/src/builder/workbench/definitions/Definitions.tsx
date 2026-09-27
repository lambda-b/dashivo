import { useState } from "react";
import { FileCode2, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSavedDashboard } from "@/app/context/useDashboard";
import { useSaveDashboard } from "@/builder/hooks/useSaveDashboard";
import { loadAssetCatalog } from "@/builder/api/python";
import { LogicDialog } from "@/builder/workbench/definitions/LogicDialog";
import { SelectList } from "@/components/primitives/SelectList";
import { IconButton } from "@/components/primitives/IconButton";
import { createUniqueIndexedName } from "@dashlet/shared/utils/createUniqueIndexedName";

export const Definitions = ({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (id: string) => void;
}) => {
  const dashboard = useSavedDashboard();
  const [adding, setAdding] = useState(false);

  const catalog = useQuery({ queryKey: ["dashboard-assets"], queryFn: loadAssetCatalog });
  const save = useSaveDashboard();

  const usedTabs = dashboard.tabs.filter((tab) =>
    tab.contents.some((content) => content.logic === selected),
  );
  const deletionDisabledReason = usedTabs.length
    ? `「${usedTabs.map((tab) => tab.label).join("」「")}」のコンテンツで使用中です。先に配置を削除するか、別のロジックに変更してください。`
    : save.isPending
      ? "設定を保存中のため削除できません。保存完了までお待ちください。"
      : "";

  const updateInput = (index: number, change: { id?: string; path?: string }) => {
    const analysis = dashboard.analysis;

    save.mutate({
      analysis: {
        ...analysis,
        inputs: analysis.inputs.map((input, i) => (i === index ? { ...input, ...change } : input)),
      },
    });
  };

  return (
    <aside className="min-h-0 overflow-y-auto border-r border-stone-200 bg-stone-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2 className="text-xs font-bold text-stone-700">ロジック定義</h2>
        <IconButton
          icon={Plus}
          label="ロジックを追加"
          disabled={!catalog.data || save.isPending}
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
            onClick={() =>
              save.mutate({
                analysis: {
                  ...dashboard.analysis,
                  logic: dashboard.analysis.logic.filter((logic) => logic.id !== selected),
                },
              })
            }
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
          className="mb-3 grid gap-2 rounded-lg border border-stone-200 bg-white p-3"
          key={input.id}
        >
          <input
            disabled={save.isPending}
            aria-label="Input ID"
            className="focus:border-brand min-w-0 rounded-md border border-stone-300 px-2 py-1.5 font-mono text-xs outline-none"
            defaultValue={input.id}
            onBlur={(event) => {
              if (event.target.value !== input.id) updateInput(index, { id: event.target.value });
            }}
          />
          <SelectList
            disabled={save.isPending}
            ariaLabel="CSVファイル"
            value={input.path}
            onChange={(path) => updateInput(index, { path })}
            options={[...new Set([input.path, ...(catalog.data?.csv ?? [])])].map((path) => ({
              label: path,
              value: path,
            }))}
          />
          <IconButton
            icon={Trash2}
            variant="danger"
            label={`${input.id}を削除`}
            disabled={save.isPending}
            onClick={() =>
              save.mutate({
                analysis: {
                  ...dashboard.analysis,
                  inputs: dashboard.analysis.inputs.filter((_, i) => i !== index),
                },
              })
            }
          />
        </div>
      ))}
      <button
        className="w-full cursor-pointer rounded-md border border-dashed border-stone-300 px-2 py-2 text-xs font-semibold text-stone-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        disabled={save.isPending || !catalog.data?.csv[0]}
        onClick={() =>
          save.mutate({
            analysis: {
              ...dashboard.analysis,
              inputs: [
                ...dashboard.analysis.inputs,
                {
                  id: createUniqueIndexedName(
                    dashboard.analysis.inputs.map((input) => input.id),
                    "input-",
                  ),
                  type: "csv",
                  path: catalog.data!.csv[0],
                },
              ],
            },
          })
        }
      >
        CSVを追加
      </button>
      {(save.error || catalog.error) && (
        <p role="alert" className="break-all text-xs text-red-700">
          {(save.error ?? catalog.error)?.message}
        </p>
      )}
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
