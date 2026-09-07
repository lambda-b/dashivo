import { useMutation, useQuery } from "@tanstack/react-query";
import { FileCode2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { loadPythonSource, savePythonSource } from "@/builder/api/pythonSource";
import { PythonCodeEditor } from "@/builder/components/PythonCodeEditor";
import { IconButton } from "@/components/primitives/IconButton";
import { SelectList } from "@/components/primitives/SelectList";
import type { AnalysisLogicDefinition, DashboardSchema } from "@/schema/dashboard";

const assetCatalogSchema = z.object({
  csv: z.array(z.string()),
  python: z.array(z.string()),
});

type InputDefinition = DashboardSchema["analysis"]["inputs"][number];

interface AnalysisActions {
  addInput: (path: string) => void;
  addLogic: (path: string) => void;
  removeInput: (index: number) => void;
  removeLogic: (index: number) => void;
  updateInput: (index: number, input: InputDefinition) => void;
  updateLogic: (index: number, logic: AnalysisLogicDefinition) => void;
}

interface AnalysisEditorProps {
  actions: AnalysisActions;
  dashboard: DashboardSchema;
}

const loadAssetCatalog = async () => {
  const response = await fetch("/__dashlet/assets");
  if (!response.ok) throw new Error("dashboard配下のファイル一覧を取得できませんでした。");
  return assetCatalogSchema.parse(await response.json());
};

const toOptions = (paths: string[], current?: string) =>
  [...new Set(current ? [current, ...paths] : paths)].map((path) => ({ label: path, value: path }));

const PythonSourceEditor = ({ path }: { path: string }) => {
  const sourceQuery = useQuery({
    queryKey: ["python-source", path],
    queryFn: () => loadPythonSource(path),
  });
  const [source, setSource] = useState("");
  const save = useMutation({ mutationFn: () => savePythonSource(path, source) });

  useEffect(() => {
    if (sourceQuery.data !== undefined) setSource(sourceQuery.data);
  }, [sourceQuery.data]);

  if (sourceQuery.isPending) return <p className="text-xs text-stone-500">読み込み中…</p>;
  if (sourceQuery.isError) {
    return <p className="text-xs text-red-700">{sourceQuery.error.message}</p>;
  }

  return (
    <div className="grid gap-3">
      <PythonCodeEditor
        ariaLabel={`${path}のPythonソース`}
        onChange={(nextSource) => {
          save.reset();
          setSource(nextSource);
        }}
        source={source}
      />
      <div className="flex items-center justify-end gap-3">
        {save.isError && <span className="text-xs text-red-700">{save.error.message}</span>}
        {save.isSuccess && <span className="text-xs text-emerald-700">保存しました</span>}
        <button
          className="bg-brand hover:bg-brand-dark inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          disabled={save.isPending || source === sourceQuery.data}
          onClick={() => save.mutate()}
          type="button"
        >
          <Save aria-hidden="true" className="size-3.5" />
          {save.isPending ? "保存中…" : "Pythonを保存"}
        </button>
      </div>
    </div>
  );
};

export const AnalysisEditor = ({ actions, dashboard }: AnalysisEditorProps) => {
  const catalog = useQuery({ queryKey: ["dashboard-assets"], queryFn: loadAssetCatalog });

  return (
    <section className="grid gap-6">
      <div>
        <h3 className="text-sm font-bold">Pythonロジック</h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          コンテンツから参照するPythonファイルと入力CSVを管理します。
        </p>
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[0.6875rem] leading-5 text-amber-800">
          ID、入力CSV、参照ファイルの変更はdashboard.jsonへ保存してください。Pythonソースは専用ボタンで直接保存します。
        </p>
      </div>

      {catalog.isError && (
        <p className="rounded-lg bg-red-50 p-3 text-xs text-red-800" role="alert">
          {catalog.error.message}
        </p>
      )}

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-stone-700">入力CSV</h4>
            <p className="mt-1 text-[0.6875rem] text-stone-500">
              dashboard/data配下から選択します。
            </p>
          </div>
          <button
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!catalog.data?.csv[0]}
            onClick={() => catalog.data?.csv[0] && actions.addInput(catalog.data.csv[0])}
            type="button"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            CSVを追加
          </button>
        </div>
        {dashboard.analysis.inputs.map((input, index) => {
          const referenced = dashboard.analysis.logic.some((logic) => logic.input === input.id);
          return (
            <fieldset
              className="grid grid-cols-[1fr_1.5fr_2.25rem] items-end gap-3 rounded-lg border border-stone-200 p-3"
              key={index}
            >
              <label className="text-xs font-medium text-stone-600">
                Input ID
                <input
                  className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
                  onChange={(event) =>
                    actions.updateInput(index, { ...input, id: event.target.value })
                  }
                  value={input.id}
                />
              </label>
              <label className="text-xs font-medium text-stone-600">
                CSVファイル
                <div className="mt-1">
                  <SelectList
                    onChange={(path) => actions.updateInput(index, { ...input, path })}
                    options={toOptions(catalog.data?.csv ?? [], input.path)}
                    value={input.path}
                  />
                </div>
              </label>
              <IconButton
                disabled={referenced}
                icon={Trash2}
                label={`${input.id}を削除`}
                onClick={() => actions.removeInput(index)}
                variant="danger"
              />
            </fieldset>
          );
        })}
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-stone-700">ロジック定義</h4>
            <p className="mt-1 text-[0.6875rem] text-stone-500">
              dashboard/logic配下のPythonを実行単位として登録します。
            </p>
          </div>
          <button
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!catalog.data?.python[0] || dashboard.analysis.inputs.length === 0}
            onClick={() => catalog.data?.python[0] && actions.addLogic(catalog.data.python[0])}
            type="button"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            ロジックを追加
          </button>
        </div>
        {dashboard.analysis.logic.map((logic, index) => {
          const referenced = dashboard.tabs.some((tab) =>
            tab.contents.some((content) => content.logic === logic.id),
          );
          return (
            <fieldset className="grid gap-3 rounded-lg border border-stone-200 p-4" key={index}>
              <div className="flex items-center justify-between gap-3">
                <legend className="text-xs font-bold tracking-wide text-stone-500">
                  PYTHON LOGIC
                </legend>
                <IconButton
                  disabled={referenced}
                  icon={Trash2}
                  label={`${logic.id}を削除`}
                  onClick={() => actions.removeLogic(index)}
                  variant="danger"
                />
              </div>
              <label className="text-xs font-medium text-stone-600">
                Logic ID
                <input
                  className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
                  onChange={(event) =>
                    actions.updateLogic(index, { ...logic, id: event.target.value })
                  }
                  value={logic.id}
                />
              </label>
              <label className="text-xs font-medium text-stone-600">
                Pythonファイル
                <div className="mt-1">
                  <SelectList
                    onChange={(path) => actions.updateLogic(index, { ...logic, path })}
                    options={toOptions(catalog.data?.python ?? [], logic.path)}
                    value={logic.path}
                  />
                </div>
              </label>
              <label className="text-xs font-medium text-stone-600">
                入力CSV
                <div className="mt-1">
                  <SelectList
                    onChange={(input) => actions.updateLogic(index, { ...logic, input })}
                    options={dashboard.analysis.inputs.map((input) => ({
                      label: `${input.id} (${input.path})`,
                      value: input.id,
                    }))}
                    value={logic.input}
                  />
                </div>
              </label>
              <details className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-stone-700">
                  <FileCode2 aria-hidden="true" className="size-3.5" />
                  Pythonソースを編集
                </summary>
                <div className="mt-3">
                  <PythonSourceEditor path={logic.path} />
                </div>
              </details>
            </fieldset>
          );
        })}
      </section>
    </section>
  );
};
