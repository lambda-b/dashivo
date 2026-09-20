import { SelectList } from "@/components/primitives/SelectList";
import type { AnalysisDefinition } from "@/schema/dashboard";

interface ContentLogicFieldsProps {
  analysis: AnalysisDefinition;
  logic: string;
  onChange: (logic: string) => void;
}

export const ContentLogicFields = ({
  analysis,
  logic: logicId,
  onChange,
}: ContentLogicFieldsProps) => {
  const logic = analysis.logic.find((candidate) => candidate.id === logicId);
  const inputs = analysis.inputs;
  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <div>
        <h4 className="text-xs font-bold text-stone-700">Pythonロジック</h4>
        <p className="mt-1 text-[0.6875rem] text-stone-500">
          このコンテンツのデータを生成するPythonロジックを選択します。
        </p>
      </div>
      <label className="text-xs font-medium text-stone-600">
        Pythonロジック
        <div className="mt-1">
          <SelectList
            onChange={onChange}
            options={analysis.logic.map((candidate) => ({
              label: `${candidate.id} (${candidate.path})`,
              value: candidate.id,
            }))}
            value={logicId}
          />
        </div>
      </label>
      <dl className="grid gap-1 border-t border-stone-200 pt-3 text-[0.6875rem]">
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <dt className="font-medium text-stone-500">CSV input</dt>
          <dd
            className="truncate font-mono text-stone-700"
            title={inputs.map((input) => input.path).join(", ")}
          >
            {inputs.map((input) => input.path).join(", ") || "未設定"}
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
