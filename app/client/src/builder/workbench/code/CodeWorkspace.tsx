import { useState } from "react";
import { Play, Save } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { useSavedDashboard } from "@/app/context/useDashboard";
import { PythonCodeEditor } from "@/builder/workbench/code/PythonCodeEditor";
import { Inspection } from "@/builder/workbench/inspection/Inspection";
import { useUnsavedChanges } from "@/builder/hooks/useUnsavedChanges";
import { usePythonActions } from "@/builder/hooks/usePythonActions";
import type { ParameterValue } from "@shared/dashboard";

export const CodeWorkspace = ({ path, savedSource }: { path: string; savedSource: string }) => {
  const dashboard = useSavedDashboard();
  const { saveSource, preview, isSaving, isPreviewing, output, error } = usePythonActions(path);

  const [source, setSource] = useState(savedSource);
  const [params, setParams] = useState<Record<string, ParameterValue>>(() =>
    Object.fromEntries(dashboard.controls.map((control) => [control.key, control.defaultValue])),
  );
  useUnsavedChanges(source !== savedSource);

  const values = Object.fromEntries(
    dashboard.controls.map((control) => [control.key, params[control.key] ?? control.defaultValue]),
  );

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
            <Button icon={Play} pending={isPreviewing} onClick={() => preview(source, values)}>
              {isPreviewing ? "実行中…" : "実行"}
            </Button>
            <Button
              icon={Save}
              pending={isSaving}
              variant="primary"
              disabled={source === savedSource}
              onClick={() => saveSource(source)}
            >
              {isSaving ? "保存中…" : "Pythonを保存"}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-stone-200">
          <PythonCodeEditor source={source} onChange={setSource} />
        </div>
      </section>
      <Inspection
        output={output}
        error={error}
        pending={isPreviewing}
        params={values}
        onParams={(key, value) => setParams((current) => ({ ...current, [key]: value }))}
      />
    </>
  );
};
