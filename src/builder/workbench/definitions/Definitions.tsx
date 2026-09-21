import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSavedDashboard, getDashboard } from "@/app/context/useDashboard";
import { saveDashboard } from "@/builder/api/dashboard";
import { loadAssetCatalog } from "@/builder/api/python";
import { LogicDialog } from "@/builder/workbench/definitions/LogicDialog";
import { SelectList } from "@/components/primitives/SelectList";
import { IconButton } from "@/components/primitives/IconButton";
import { createUniqueIndexedName } from "@/utils/createUniqueIndexedName";
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
  const save = useMutation({ mutationFn: saveDashboard });
  const updateInput = (index: number, change: { id?: string; path?: string }) => {
    const analysis = getDashboard().analysis;
    save.mutate({
      analysis: {
        ...analysis,
        inputs: analysis.inputs.map((input, i) => (i === index ? { ...input, ...change } : input)),
      },
    });
  };
  return (
    <aside className="min-h-0 overflow-auto border-r bg-stone-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">ロジック定義</h2>
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
          className="mb-2 block w-full break-all rounded border p-3 text-left text-xs aria-pressed:bg-red-50"
        >
          <strong>{logic.id}</strong>
          <span className="mt-1 block">{logic.path}</span>
        </button>
      ))}
      {selected && (
        <IconButton
          icon={Trash2}
          variant="danger"
          label="選択中の定義を削除"
          disabled={
            save.isPending ||
            dashboard.tabs.some((tab) => tab.contents.some((content) => content.logic === selected))
          }
          onClick={() =>
            save.mutate({
              analysis: {
                ...dashboard.analysis,
                logic: dashboard.analysis.logic.filter((logic) => logic.id !== selected),
              },
            })
          }
        />
      )}
      <h3 className="mb-3 mt-6 font-bold">入力CSV</h3>
      {dashboard.analysis.inputs.map((input, index) => (
        <div className="mb-3 grid gap-2" key={input.id}>
          <input
            disabled={save.isPending}
            aria-label="Input ID"
            className="min-w-0 rounded border p-2 text-xs"
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
        className="text-sm"
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
