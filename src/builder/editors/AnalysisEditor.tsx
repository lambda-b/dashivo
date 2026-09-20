import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Braces,
  CircleAlert,
  FileCode2,
  LoaderCircle,
  Play,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { loadPythonSource, savePythonSource } from "@/builder/api/pythonSource";
import { PythonCodeEditor } from "@/builder/components/PythonCodeEditor";
import { DashboardContent } from "@/components/contents/DashboardContent";
import { IconButton } from "@/components/primitives/IconButton";
import { SelectList } from "@/components/primitives/SelectList";
import { analysisPort } from "@/ports/analysis";
import type {
  AnalysisLogicDefinition,
  AnalysisOutput,
  DashboardSchema,
  ParameterValue,
  TabDefinition,
} from "@/schema/dashboard";
import { validateContentBindings } from "@/schema/validation";

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
  onSelectLogic: (logicId: string) => void;
  selectedLogicId?: string;
}

interface LogicWorkbenchProps {
  actions: AnalysisActions;
  catalog: z.infer<typeof assetCatalogSchema>;
  dashboard: DashboardSchema;
  logic: AnalysisLogicDefinition;
  logicIndex: number;
  onLogicIdChange: (logicId: string) => void;
}

const loadAssetCatalog = async () => {
  const response = await fetch("/__dashlet/assets");
  if (!response.ok) throw new Error("dashboard配下のファイル一覧を取得できませんでした。");
  return assetCatalogSchema.parse(await response.json());
};

const loadCsvSource = async (path: string) => {
  const response = await fetch("/dashboard/" + path);
  if (!response.ok) throw new Error("CSVファイル「" + path + "」を読み込めませんでした。");
  return response.text();
};

const toOptions = (paths: string[], current?: string) =>
  [...new Set(current ? [current, ...paths] : paths)].map((path) => ({ label: path, value: path }));

const getOutputSchema = (output: AnalysisOutput) => {
  if (typeof output === "number") return [{ name: "value", type: "number" }];
  const values = new Map<string, Set<string>>();
  for (const row of output.slice(0, 100)) {
    for (const [key, value] of Object.entries(row)) {
      const types = values.get(key) ?? new Set<string>();
      types.add(value === null ? "null" : typeof value);
      values.set(key, types);
    }
  }
  return [...values].map(([name, types]) => ({ name, type: [...types].join(" | ") }));
};

const LogicWorkbench = ({
  actions,
  catalog,
  dashboard,
  logic,
  logicIndex,
  onLogicIdChange,
}: LogicWorkbenchProps) => {
  const inputs = dashboard.analysis.inputs;
  const [selectedInputId, setSelectedInputId] = useState(inputs[0]?.id);
  const selectedInput = inputs.find((input) => input.id === selectedInputId) ?? inputs[0];
  const params = useMemo<Record<string, ParameterValue>>(
    () =>
      Object.fromEntries(dashboard.controls.map((control) => [control.key, control.defaultValue])),
    [dashboard.controls],
  );
  const referencedContents = dashboard.tabs.flatMap((tab) =>
    tab.contents.filter((content) => content.logic === logic.id),
  );
  const [selectedContentId, setSelectedContentId] = useState(referencedContents[0]?.id);
  const selectedContent =
    referencedContents.find((content) => content.id === selectedContentId) ?? referencedContents[0];
  const previewTab: TabDefinition = {
    id: "python-preview",
    label: "出力プレビュー",
    contents: selectedContent ? [selectedContent] : [],
  };
  const sourceQuery = useQuery({
    queryKey: ["python-source", logic.path],
    queryFn: () => loadPythonSource(logic.path),
  });
  const [source, setSource] = useState("");
  const [executedSource, setExecutedSource] = useState<string>();
  const save = useMutation({ mutationFn: () => savePythonSource(logic.path, source) });
  const preview = useQuery({
    queryKey: ["python-preview", logic.path, inputs, params, executedSource],
    enabled: inputs.length > 0 && executedSource !== undefined,
    queryFn: async () => {
      if (inputs.length === 0 || executedSource === undefined) {
        throw new Error("実行条件が不足しています。");
      }
      const result = await analysisPort.preview({
        analysisSource: executedSource,
        params,
        sources: await Promise.all(
          inputs.map(async (input) => ({
            id: input.id,
            sourceData: await loadCsvSource(input.path),
          })),
        ),
      });
      validateContentBindings(
        { ...dashboard, tabs: [{ ...previewTab, contents: referencedContents }] },
        { [logic.id]: result.output },
      );
      return result;
    },
    retry: false,
  });

  useEffect(() => {
    if (sourceQuery.data === undefined) return;
    setSource(sourceQuery.data);
    setExecutedSource(sourceQuery.data);
  }, [sourceQuery.data]);

  const run = () => {
    if (source === executedSource) {
      void preview.refetch();
      return;
    }
    setExecutedSource(source);
  };

  if (sourceQuery.isPending) {
    return (
      <div className="grid h-full place-items-center text-sm text-stone-500">
        Pythonソースを読み込んでいます…
      </div>
    );
  }
  if (sourceQuery.isError) {
    return (
      <div className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
        {sourceQuery.error.message}
      </div>
    );
  }

  const schema = preview.data === undefined ? [] : getOutputSchema(preview.data.output);
  const rawOutput =
    preview.data === undefined
      ? undefined
      : JSON.stringify(
          Array.isArray(preview.data.output)
            ? preview.data.output.slice(0, 20)
            : preview.data.output,
          null,
          2,
        );
  const selectedInputRows =
    preview.data && selectedInput ? (preview.data.inputRows[selectedInput.id] ?? []) : [];
  const selectedInputColumns = [...new Set(selectedInputRows.flatMap((row) => Object.keys(row)))];

  return (
    <div className="grid h-full min-h-0 lg:grid-cols-[minmax(28rem,1.1fr)_minmax(24rem,0.9fr)]">
      <section className="min-h-0 overflow-y-auto border-r border-stone-200 p-5">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-stone-600">
            Logic ID
            <input
              className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
              onChange={(event) => {
                actions.updateLogic(logicIndex, { ...logic, id: event.target.value });
                onLogicIdChange(event.target.value);
              }}
              value={logic.id}
            />
          </label>
          <label className="text-xs font-medium text-stone-600">
            Pythonファイル
            <div className="mt-1">
              <SelectList
                onChange={(path) => actions.updateLogic(logicIndex, { ...logic, path })}
                options={toOptions(catalog.python, logic.path)}
                value={logic.path}
              />
            </div>
          </label>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Pythonコード</h3>
            <p className="mt-1 text-xs text-stone-500">保存前のコードも右側で試行実行できます。</p>
          </div>
          <div className="flex items-center gap-2">
            {source !== executedSource && (
              <span className="text-xs font-medium text-amber-700">変更後は未実行</span>
            )}
            <button
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-50"
              disabled={preview.isFetching}
              onClick={run}
              type="button"
            >
              {preview.isFetching ? (
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
              ) : (
                <Play aria-hidden="true" className="size-3.5" />
              )}
              {preview.isFetching ? "実行中…" : "実行"}
            </button>
            <button
              className="bg-brand hover:bg-brand-dark inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-50"
              disabled={save.isPending || source === sourceQuery.data}
              onClick={() => save.mutate()}
              type="button"
            >
              <Save aria-hidden="true" className="size-3.5" />
              {save.isPending ? "保存中…" : "Pythonを保存"}
            </button>
          </div>
        </div>

        <PythonCodeEditor
          ariaLabel={logic.path + "のPythonソース"}
          height="calc(100vh - 22rem)"
          onChange={(nextSource) => {
            save.reset();
            setSource(nextSource);
          }}
          source={source}
        />
        {save.isError && <p className="mt-2 text-xs text-red-700">{save.error.message}</p>}
        {save.isSuccess && <p className="mt-2 text-xs text-emerald-700">保存しました</p>}
      </section>

      <section className="grid min-h-0 content-start gap-4 overflow-y-auto bg-stone-50 p-5">
        <details className="rounded-xl border border-stone-200 bg-white p-4">
          <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-stone-700">
            <span>入力値を参照</span>
            <span className="rounded bg-stone-100 px-2 py-1 font-mono text-[0.625rem] font-normal text-stone-500">
              {inputs.length} CSV · {dashboard.controls.length} Parameters
            </span>
          </summary>
          <div className="mt-4 grid gap-5 border-t border-stone-100 pt-4">
            <div>
              <p className="mb-2 text-[0.6875rem] font-semibold text-stone-500">CSV（先頭5件）</p>
              {preview.data && selectedInput ? (
                <div className="grid gap-3">
                  <SelectList
                    ariaLabel="プレビューするCSV"
                    onChange={setSelectedInputId}
                    options={inputs.map((input) => ({
                      label: `${input.id} (${input.path})`,
                      value: input.id,
                    }))}
                    value={selectedInput.id}
                  />
                  <div className="overflow-hidden rounded-md border border-stone-200">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max border-collapse text-xs">
                        <thead className="bg-stone-50 text-stone-500">
                          <tr>
                            {selectedInputColumns.map((column) => (
                              <th
                                className="border-b border-stone-200 px-3 py-2 text-left"
                                key={column}
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInputRows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {selectedInputColumns.map((column) => (
                                <td
                                  className="border-b border-stone-100 px-3 py-2 font-mono"
                                  key={column}
                                >
                                  {String(row[column] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400">実行後にCSVの内容を表示します。</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-[0.6875rem] font-semibold text-stone-500">
                利用可能なParameters
              </p>
              <dl className="grid gap-2">
                {dashboard.controls.map((control) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,1fr)] items-start gap-3 rounded-md bg-stone-50 px-3 py-2"
                    key={control.key}
                  >
                    <div className="min-w-0">
                      <dt className="break-all font-mono text-xs text-stone-700">{control.key}</dt>
                      <dd className="text-[0.625rem] text-stone-400">
                        {control.displayName} · {control.type}
                      </dd>
                    </div>
                    <dd className="break-all text-right font-mono text-[0.6875rem] leading-5 text-stone-500">
                      {JSON.stringify(control.defaultValue)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </details>

        <details className="rounded-xl border border-stone-200 bg-white p-4" open>
          <summary className="cursor-pointer text-sm font-bold text-stone-700">
            出力プレビュー
          </summary>
          <p className="mt-2 border-t border-stone-100 pt-3 text-xs text-stone-500">
            現在のコード、CSV、初期パラメータで実行します。
          </p>

          <div className="mt-4">
            {preview.isFetching ? (
              <div className="grid h-64 place-items-center rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  Pythonを実行しています…
                </span>
              </div>
            ) : preview.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <CircleAlert aria-hidden="true" className="size-4" />
                  実行に失敗しました
                </p>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs">
                  {preview.error.message}
                </pre>
              </div>
            ) : preview.data !== undefined ? (
              <div className="grid gap-5">
                {selectedContent ? (
                  <div className="grid gap-3">
                    <label className="text-xs font-medium text-stone-600">
                      プレビューするコンテンツ
                      <div className="mt-1">
                        <SelectList
                          onChange={setSelectedContentId}
                          options={referencedContents.map((content) => ({
                            label: `${content.title} (${content.type})`,
                            value: content.id,
                          }))}
                          value={selectedContent.id}
                        />
                      </div>
                    </label>
                    <DashboardContent
                      results={{ [logic.id]: preview.data.output }}
                      tab={previewTab}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-xs leading-5 text-stone-500">
                    このロジックを参照するコンテンツはまだありません。
                    <br />
                    Raw DataとSchemaは確認できます。
                  </div>
                )}

                <details className="rounded-xl border border-stone-200 bg-white p-4" open>
                  <summary className="flex cursor-pointer items-center gap-2 text-xs font-bold text-stone-700">
                    <Braces aria-hidden="true" className="size-4" />
                    Output Schema
                  </summary>
                  <dl className="mt-3 grid gap-2">
                    {schema.map((column) => (
                      <div
                        className="flex items-center justify-between gap-4 rounded-md bg-stone-50 px-3 py-2"
                        key={column.name}
                      >
                        <dt className="font-mono text-xs text-stone-700">{column.name}</dt>
                        <dd className="font-mono text-[0.6875rem] text-stone-400">{column.type}</dd>
                      </div>
                    ))}
                  </dl>
                </details>

                <details className="rounded-xl border border-stone-200 bg-white p-4">
                  <summary className="cursor-pointer text-xs font-bold text-stone-700">
                    Raw Data（先頭20件）
                  </summary>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre text-[0.6875rem] leading-5 text-stone-600">
                    {rawOutput}
                  </pre>
                </details>
              </div>
            ) : null}
          </div>
        </details>
      </section>
    </div>
  );
};

export const AnalysisEditor = ({
  actions,
  dashboard,
  onSelectLogic,
  selectedLogicId,
}: AnalysisEditorProps) => {
  const catalog = useQuery({ queryKey: ["dashboard-assets"], queryFn: loadAssetCatalog });
  const selectedLogicIndex = Math.max(
    0,
    dashboard.analysis.logic.findIndex((definition) => definition.id === selectedLogicId),
  );
  const logic = dashboard.analysis.logic[selectedLogicIndex];

  return (
    <section className="grid h-full min-h-0 grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-stone-200 bg-stone-50 p-3">
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-xs font-bold text-stone-700">出力定義</h3>
            <p className="mt-0.5 text-[0.625rem] text-stone-400">Pythonと出力をまとめて編集</p>
          </div>
          <IconButton
            disabled={!catalog.data?.python[0] || dashboard.analysis.inputs.length === 0}
            icon={Plus}
            label="Pythonロジックを追加"
            onClick={() => catalog.data?.python[0] && actions.addLogic(catalog.data.python[0])}
          />
        </div>

        <div className="grid gap-1">
          {dashboard.analysis.logic.map((definition, index) => {
            const contentCount = dashboard.tabs.reduce(
              (count, tab) =>
                count + tab.contents.filter((content) => content.logic === definition.id).length,
              0,
            );
            return (
              <button
                aria-pressed={index === selectedLogicIndex}
                className="aria-pressed:border-brand/30 aria-pressed:bg-brand-soft aria-pressed:text-brand-dark cursor-pointer rounded-lg border border-transparent px-3 py-2.5 text-left hover:bg-white"
                key={definition.id}
                onClick={() => onSelectLogic(definition.id)}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <FileCode2 aria-hidden="true" className="size-3.5 shrink-0" />
                  <strong className="min-w-0 truncate font-mono text-xs">{definition.id}</strong>
                </span>
                <span className="mt-1 block truncate pl-5 font-mono text-[0.625rem] text-stone-400">
                  {definition.path}
                </span>
                <span className="mt-1 block pl-5 text-[0.625rem] text-stone-400">
                  {contentCount}コンテンツで使用
                </span>
              </button>
            );
          })}
        </div>

        <details className="mt-5 border-t border-stone-200 pt-4">
          <summary className="cursor-pointer px-1 text-xs font-bold text-stone-600">
            入力CSVを管理
          </summary>
          <div className="mt-3 grid gap-3">
            {dashboard.analysis.inputs.map((input, index) => {
              return (
                <fieldset
                  className="grid gap-2 rounded-lg border border-stone-200 bg-white p-3"
                  key={index}
                >
                  <input
                    aria-label="Input ID"
                    className="focus:border-brand min-w-0 rounded-md border border-stone-300 px-2 py-1.5 font-mono text-xs outline-none"
                    onChange={(event) =>
                      actions.updateInput(index, { ...input, id: event.target.value })
                    }
                    value={input.id}
                  />
                  <SelectList
                    ariaLabel="CSVファイル"
                    onChange={(path) => actions.updateInput(index, { ...input, path })}
                    options={toOptions(catalog.data?.csv ?? [], input.path)}
                    value={input.path}
                  />
                  <IconButton
                    icon={Trash2}
                    label={input.id + "を削除"}
                    onClick={() => actions.removeInput(index)}
                    variant="danger"
                  />
                </fieldset>
              );
            })}
            <button
              className="cursor-pointer rounded-md border border-dashed border-stone-300 px-2 py-2 text-xs font-semibold text-stone-600 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!catalog.data?.csv[0]}
              onClick={() => catalog.data?.csv[0] && actions.addInput(catalog.data.csv[0])}
              type="button"
            >
              CSVを追加
            </button>
          </div>
        </details>

        {logic && (
          <button
            className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={dashboard.tabs.some((tab) =>
              tab.contents.some((content) => content.logic === logic.id),
            )}
            onClick={() => actions.removeLogic(selectedLogicIndex)}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            選択中の定義を削除
          </button>
        )}
      </aside>

      <div className="min-h-0">
        {catalog.isError ? (
          <p className="m-5 rounded-lg bg-red-50 p-3 text-xs text-red-800" role="alert">
            {catalog.error.message}
          </p>
        ) : catalog.data && logic ? (
          <LogicWorkbench
            actions={actions}
            catalog={catalog.data}
            dashboard={dashboard}
            key={`${selectedLogicIndex}:${logic.path}`}
            logic={logic}
            logicIndex={selectedLogicIndex}
            onLogicIdChange={onSelectLogic}
          />
        ) : catalog.isPending ? (
          <div className="grid h-full place-items-center text-sm text-stone-500">
            Asset一覧を読み込んでいます…
          </div>
        ) : (
          <div className="grid h-full place-items-center text-sm text-stone-500">
            Pythonロジックを追加してください。
          </div>
        )}
      </div>
    </section>
  );
};
