import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChartContentEditor } from "@/builder/editors/contents/ChartContentEditor";
import { createContent, type ContentType } from "@/builder/hooks/useContentActions";
import { ContentAppearanceStep } from "@/builder/wizards/ContentAppearanceStep";
import { bindLogic, ContentLogicStep, type LogicMode } from "@/builder/wizards/ContentLogicStep";
import { ContentTypeStep } from "@/builder/wizards/ContentTypeStep";
import { IconButton } from "@/components/primitives/IconButton";
import type {
  AnalysisLogicDefinition,
  ContentDefinition,
  DashboardSchema,
} from "@/schema/dashboard";

export interface ContentWizardResult {
  content: ContentDefinition;
  logic?: AnalysisLogicDefinition;
  pythonSource?: string;
}

interface ContentWizardProps {
  dashboard: DashboardSchema;
  onClose: () => void;
  onComplete: (result: ContentWizardResult) => Promise<void>;
  open: boolean;
  tabIndex: number;
}

const pythonTemplate = `import sys

import numpy as np
import pandas as pd


def execute(params):
    # paramsには画面パラメータとCSV文字列のsource_dataが渡されます
    return {
        "runtime": {
            "python": sys.version.split()[0],
            "pandas": pd.__version__,
            "numpy": np.__version__,
        },
        "datasets": {"result": []},
        "metrics": {"value": 0},
    }
`;

const createLogic = (dashboard: DashboardSchema, type: ContentType): AnalysisLogicDefinition => {
  const ids = new Set(dashboard.analysis.logic.map((logic) => logic.id));
  let index = dashboard.analysis.logic.length + 1;
  while (ids.has(`logic-${index}`)) index += 1;
  return {
    id: `logic-${index}`,
    type: "python",
    path: `logic/analysis_${index}.py`,
    input: dashboard.analysis.inputs[0]?.id ?? "input",
    outputs:
      type === "metric"
        ? { datasets: [], metrics: ["value"] }
        : { datasets: ["result"], metrics: [] },
  };
};

export const ContentWizard = ({
  dashboard,
  onClose,
  onComplete,
  open,
  tabIndex,
}: ContentWizardProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [content, setContent] = useState<ContentDefinition>();
  const [logicMode, setLogicMode] = useState<LogicMode>("existing");
  const [newLogic, setNewLogic] = useState<AnalysisLogicDefinition>();
  const [pythonSource, setPythonSource] = useState(pythonTemplate);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const steps =
    content?.type === "chart" && content.chart.type !== "pie"
      ? ["種類", "Pythonロジック", "グラフ設定", "軸設定"]
      : ["種類", "Pythonロジック", "表示設定"];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const reset = () => {
    setStep(0);
    setContent(undefined);
    setLogicMode("existing");
    setNewLogic(undefined);
    setPythonSource(pythonTemplate);
    setError(undefined);
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const chooseType = (type: ContentType) => {
    const nextContent = createContent(dashboard, type);
    const nextLogic = createLogic(dashboard, type);
    setNewLogic(nextLogic);
    if (dashboard.analysis.logic.length === 0) {
      setLogicMode("new");
      setContent(bindLogic(nextContent, nextLogic));
      return;
    }
    setLogicMode("existing");
    setContent(nextContent);
  };

  const finish = async () => {
    if (!content) return;
    setSaving(true);
    setError(undefined);
    try {
      await onComplete({
        content,
        logic: logicMode === "new" ? newLogic : undefined,
        pythonSource: logicMode === "new" ? pythonSource : undefined,
      });
      close();
    } catch (cause) {
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "コンテンツを作成できませんでした。");
    }
  };

  const canContinue =
    step === 0
      ? content !== undefined
      : step === 1 && logicMode === "new"
        ? Boolean(
            newLogic?.id &&
            newLogic.path.startsWith("logic/") &&
            newLogic.path.endsWith(".py") &&
            newLogic.input &&
            (content?.type === "metric"
              ? newLogic.outputs.metrics[0]
              : newLogic.outputs.datasets[0]),
          )
        : true;

  return (
    <dialog
      aria-labelledby="content-wizard-title"
      className="m-auto h-[min(52rem,calc(100%-2rem))] w-[min(64rem,calc(100%-2rem))] rounded-2xl border border-stone-200 bg-white p-0 text-stone-800 shadow-2xl backdrop:bg-stone-950/45"
      onClose={close}
      ref={dialogRef}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-start justify-between gap-6 border-b border-stone-200 px-7 py-5">
          <div>
            <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">
              CONTENT WIZARD
            </p>
            <h2 className="mt-1 text-xl font-bold" id="content-wizard-title">
              コンテンツを追加
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              対象タブ: {dashboard.tabs[tabIndex]?.label}
            </p>
          </div>
          <IconButton icon={X} label="コンテンツ追加を閉じる" onClick={close} />
        </header>

        <ol
          className="grid border-b border-stone-200 bg-stone-50"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((label, index) => (
            <li
              className={`flex items-center gap-2 border-r border-stone-200 px-4 py-3 text-xs last:border-r-0 ${index === step ? "bg-white font-bold text-stone-900" : "text-stone-400"}`}
              key={label}
            >
              <span
                className={`grid size-5 place-items-center rounded-full text-[0.625rem] ${index < step ? "bg-emerald-600 text-white" : index === step ? "bg-brand text-white" : "bg-stone-200"}`}
              >
                {index < step ? <Check aria-hidden="true" className="size-3" /> : index + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>

        <div className="min-h-0 flex-1 overflow-y-auto p-7">
          {step === 0 ? (
            <ContentTypeStep onChange={chooseType} value={content?.type} />
          ) : step === 1 && content && newLogic ? (
            <ContentLogicStep
              content={content}
              dashboard={dashboard}
              logicMode={logicMode}
              newLogic={newLogic}
              onContentChange={setContent}
              onLogicModeChange={setLogicMode}
              onNewLogicChange={setNewLogic}
              onPythonSourceChange={setPythonSource}
              pythonSource={pythonSource}
            />
          ) : step === 2 && content ? (
            <div>
              <h3 className="text-lg font-bold">
                {content.type === "chart" ? "グラフを設定" : "表示内容を設定"}
              </h3>
              <p className="mt-1 text-sm text-stone-500">データの対応付けと見た目を設定します。</p>
              <div className="mt-5">
                <ContentAppearanceStep content={content} onChange={setContent} />
              </div>
            </div>
          ) : step === 3 && content?.type === "chart" ? (
            <div>
              <h3 className="text-lg font-bold">軸の書式を設定</h3>
              <p className="mt-1 text-sm text-stone-500">
                Excelの軸設定と同様にタイトル、数値形式、表示範囲を指定します。
              </p>
              <div className="mt-5">
                <ChartContentEditor content={content} onChange={setContent} section="axes" />
              </div>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-stone-200 px-7 py-4">
          <button
            className="cursor-pointer rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-40"
            disabled={step === 0 || saving}
            onClick={() => setStep((current) => current - 1)}
            type="button"
          >
            戻る
          </button>
          <div className="flex items-center gap-3">
            {error && <span className="max-w-md text-xs text-red-700">{error}</span>}
            {step < steps.length - 1 ? (
              <button
                className="bg-brand hover:bg-brand-dark cursor-pointer rounded-md px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canContinue}
                onClick={() => setStep((current) => current + 1)}
                type="button"
              >
                次へ
              </button>
            ) : (
              <button
                className="bg-brand hover:bg-brand-dark cursor-pointer rounded-md px-5 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50"
                disabled={saving}
                onClick={finish}
                type="button"
              >
                {saving ? "作成中…" : "コンテンツを作成"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </dialog>
  );
};
