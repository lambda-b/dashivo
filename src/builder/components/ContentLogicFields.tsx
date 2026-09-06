import { SelectList } from "@/components/primitives/SelectList";
import type { AnalysisDefinition } from "@/schema/dashboard";

interface ContentLogicFieldsProps {
  analysis: AnalysisDefinition;
  logic: string;
  onChange: (logic: string, output: string) => void;
  output: string;
  outputType: "datasets" | "metrics";
}

export const ContentLogicFields = ({
  analysis,
  logic: logicId,
  onChange,
  output,
  outputType,
}: ContentLogicFieldsProps) => {
  const logic = analysis.logic.find((candidate) => candidate.id === logicId);
  const input = analysis.inputs.find((candidate) => candidate.id === logic?.input);
  const outputs = logic?.outputs[outputType] ?? [];

  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <div>
        <h4 className="text-xs font-bold text-stone-700">Pythonロジック</h4>
        <p className="mt-1 text-[0.6875rem] text-stone-500">
          このコンテンツのデータを生成するPythonロジックを選択します。
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-stone-600">
          Pythonロジック
          <div className="mt-1">
            <SelectList
              onChange={(nextLogicId) => {
                const nextLogic = analysis.logic.find((candidate) => candidate.id === nextLogicId);
                onChange(nextLogicId, nextLogic?.outputs[outputType][0] ?? "");
              }}
              options={analysis.logic.map((candidate) => ({
                label: `${candidate.id} (${candidate.path})`,
                value: candidate.id,
              }))}
              value={logicId}
            />
          </div>
        </label>
        <label className="text-xs font-medium text-stone-600">
          {outputType === "metrics" ? "出力値" : "出力データセット"}
          <div className="mt-1">
            <SelectList
              onChange={(nextOutput) => onChange(logicId, nextOutput)}
              options={outputs.map((value) => ({ label: value, value }))}
              value={output}
            />
          </div>
        </label>
      </div>
      <dl className="grid gap-1 border-t border-stone-200 pt-3 text-[0.6875rem]">
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <dt className="font-medium text-stone-500">CSV input</dt>
          <dd className="truncate font-mono text-stone-700" title={input?.path}>
            {input?.path ?? "未設定"}
          </dd>
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <dt className="font-medium text-stone-500">Python logic</dt>
          <dd className="truncate font-mono text-stone-700" title={logic?.path}>
            {logic?.path ?? "未設定"}
          </dd>
        </div>
      </dl>
    </section>
  );
};
