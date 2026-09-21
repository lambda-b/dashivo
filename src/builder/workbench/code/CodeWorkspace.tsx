import { useState } from "react";
import { LoaderCircle, Play, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSavedDashboard } from "@/app/context/useDashboard";
import { savePythonSource } from "@/builder/api/python";
import { PythonCodeEditor } from "@/builder/workbench/code/PythonCodeEditor";
import { Inspection } from "@/builder/workbench/inspection/Inspection";
import { useUnsavedChanges } from "@/builder/hooks/useUnsavedChanges";
import { analysisPort, loadInputs } from "@/ports/analysis";
import type { ParameterValue } from "@/schema/dashboard";

export const CodeWorkspace = ({ path, savedSource }: { path: string; savedSource: string }) => {
  const dashboard = useSavedDashboard();
  const client = useQueryClient();

  const [source, setSource] = useState(savedSource);
  const [params, setParams] = useState<Record<string, ParameterValue>>(() =>
    Object.fromEntries(dashboard.controls.map((control) => [control.key, control.defaultValue])),
  );
  useUnsavedChanges(source !== savedSource);

  const save = useMutation({
    mutationFn: (code: string) => savePythonSource(path, code),
    onSuccess: (_, code) => {
      client.setQueryData(["python-source", path], code);
      void client.invalidateQueries({ queryKey: ["analysis"] });
    },
  });

  const run = useMutation({
    mutationFn: async () =>
      analysisPort.preview({
        analysisSource: source,
        params: Object.fromEntries(
          dashboard.controls.map((control) => [
            control.key,
            params[control.key] ?? control.defaultValue,
          ]),
        ),
        sources: await loadInputs(dashboard.analysis),
      }),
  });

  return (
    <>
      <section className="flex min-h-0 min-w-0 flex-col border-r border-stone-200 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Pythonコード</h2>
            <p className="mt-1 break-all font-mono text-xs text-stone-500">{path}</p>
          </div>
          <div className="flex items-center gap-2">
            {source !== savedSource && (
              <span className="text-xs font-medium text-amber-700">未保存</span>
            )}
            <button
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-50"
              disabled={run.isPending}
              onClick={() => run.mutate()}
            >
              {run.isPending ? (
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
              ) : (
                <Play aria-hidden="true" className="size-3.5" />
              )}
              {run.isPending ? "実行中…" : "実行"}
            </button>
            <button
              className="bg-brand hover:bg-brand-dark inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={save.isPending || source === savedSource}
              onClick={() => save.mutate(source)}
            >
              <Save aria-hidden="true" className="size-3.5" />
              {save.isPending ? "保存中…" : "Pythonを保存"}
            </button>
          </div>
        </div>
        {save.error && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {save.error.message}
          </p>
        )}
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-stone-200">
          <PythonCodeEditor source={source} onChange={setSource} />
        </div>
      </section>
      <Inspection
        output={run.data?.output}
        error={run.error}
        pending={run.isPending}
        params={Object.fromEntries(
          dashboard.controls.map((control) => [
            control.key,
            params[control.key] ?? control.defaultValue,
          ]),
        )}
        onParams={(key, value) => setParams((current) => ({ ...current, [key]: value }))}
      />
    </>
  );
};
