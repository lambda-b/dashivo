import { useState } from "react";
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
      <section className="flex min-h-0 flex-col border-r">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3 text-xs">
          <span className="break-all font-mono">
            {path}
            {source !== savedSource && " · 未保存"}
          </span>
          <div className="flex gap-3">
            <button disabled={run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? "実行中…" : "実行"}
            </button>
            <button
              disabled={save.isPending || source === savedSource}
              onClick={() => save.mutate(source)}
            >
              {save.isPending ? "保存中…" : "Pythonを保存"}
            </button>
          </div>
        </div>
        {save.error && (
          <p role="alert" className="p-2 text-red-700">
            {save.error.message}
          </p>
        )}
        <div className="min-h-0 flex-1">
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
