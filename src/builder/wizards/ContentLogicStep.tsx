import { FileCode2 } from "lucide-react";
import { PythonCodeEditor } from "@/builder/components/PythonCodeEditor";
import { ContentLogicFields } from "@/builder/components/ContentLogicFields";
import { SelectList } from "@/components/primitives/SelectList";
import type {
  AnalysisLogicDefinition,
  ContentDefinition,
  DashboardSchema,
} from "@/schema/dashboard";

export type LogicMode = "existing" | "new";

interface ContentLogicStepProps {
  content: ContentDefinition;
  dashboard: DashboardSchema;
  logicMode: LogicMode;
  newLogic: AnalysisLogicDefinition;
  onContentChange: (content: ContentDefinition) => void;
  onLogicModeChange: (mode: LogicMode) => void;
  onNewLogicChange: (logic: AnalysisLogicDefinition) => void;
  onPythonSourceChange: (source: string) => void;
  pythonSource: string;
}

export const bindLogic = (content: ContentDefinition, logic: AnalysisLogicDefinition) => {
  if (content.type === "metric") {
    return { ...content, logic: logic.id, metric: logic.outputs.metrics[0] ?? "value" };
  }
  return { ...content, logic: logic.id, dataset: logic.outputs.datasets[0] ?? "result" };
};

const setOutput = (
  logic: AnalysisLogicDefinition,
  content: ContentDefinition,
  output: string,
): AnalysisLogicDefinition => ({
  ...logic,
  outputs:
    content.type === "metric"
      ? { ...logic.outputs, metrics: [output] }
      : { ...logic.outputs, datasets: [output] },
});

export const ContentLogicStep = ({
  content,
  dashboard,
  logicMode,
  newLogic,
  onContentChange,
  onLogicModeChange,
  onNewLogicChange,
  onPythonSourceChange,
  pythonSource,
}: ContentLogicStepProps) => (
  <div className="grid gap-5">
    <div>
      <h3 className="text-lg font-bold">Pythonロジックを紐付け</h3>
      <p className="mt-1 text-sm text-stone-500">
        既存ロジックを選ぶか、このコンテンツ用のPythonを作成します。
      </p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {(["existing", "new"] as const).map((mode) => (
        <button
          aria-pressed={logicMode === mode}
          className={`cursor-pointer rounded-lg border p-4 text-left text-sm font-semibold ${logicMode === mode ? "border-brand bg-brand-soft" : "border-stone-200"}`}
          disabled={mode === "existing" && dashboard.analysis.logic.length === 0}
          key={mode}
          onClick={() => {
            onLogicModeChange(mode);
            onContentChange(
              bindLogic(content, mode === "new" ? newLogic : dashboard.analysis.logic[0]),
            );
          }}
          type="button"
        >
          {mode === "existing" ? "登録済みロジックを使用" : "新しいPythonロジックを作成"}
        </button>
      ))}
    </div>

    {logicMode === "existing" ? (
      <ContentLogicFields
        analysis={dashboard.analysis}
        logic={content.logic}
        onChange={(logic, output) =>
          onContentChange(
            content.type === "metric"
              ? { ...content, logic, metric: output }
              : { ...content, logic, dataset: output },
          )
        }
        output={content.type === "metric" ? content.metric : content.dataset}
        outputType={content.type === "metric" ? "metrics" : "datasets"}
      />
    ) : (
      <div className="grid gap-4 rounded-xl border border-stone-200 p-5">
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          作成完了時にPythonファイルとdashboard.jsonを保存し、実行環境を再読み込みします。
        </p>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-xs font-medium text-stone-600">
            Logic ID
            <input
              className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
              onChange={(event) => {
                const logic = { ...newLogic, id: event.target.value };
                onNewLogicChange(logic);
                onContentChange(bindLogic(content, logic));
              }}
              value={newLogic.id}
            />
          </label>
          <label className="text-xs font-medium text-stone-600">
            Pythonファイル
            <input
              className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
              onChange={(event) => onNewLogicChange({ ...newLogic, path: event.target.value })}
              value={newLogic.path}
            />
          </label>
          <label className="text-xs font-medium text-stone-600">
            入力CSV
            <div className="mt-1">
              <SelectList
                onChange={(input) => onNewLogicChange({ ...newLogic, input })}
                options={dashboard.analysis.inputs.map((input) => ({
                  label: `${input.id} (${input.path})`,
                  value: input.id,
                }))}
                value={newLogic.input}
              />
            </div>
          </label>
          <label className="text-xs font-medium text-stone-600">
            {content.type === "metric" ? "出力Metric" : "出力Dataset"}
            <input
              className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
              onChange={(event) => {
                const output = event.target.value;
                const logic = setOutput(newLogic, content, output);
                onNewLogicChange(logic);
                onContentChange(
                  content.type === "metric"
                    ? { ...content, logic: logic.id, metric: output }
                    : { ...content, logic: logic.id, dataset: output },
                );
              }}
              value={
                content.type === "metric"
                  ? newLogic.outputs.metrics[0]
                  : newLogic.outputs.datasets[0]
              }
            />
          </label>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-stone-700">
            <FileCode2 aria-hidden="true" className="size-3.5" />
            Pythonソース
          </div>
          <PythonCodeEditor
            ariaLabel="新しいPythonソース"
            onChange={onPythonSourceChange}
            source={pythonSource}
          />
        </div>
      </div>
    )}
  </div>
);
