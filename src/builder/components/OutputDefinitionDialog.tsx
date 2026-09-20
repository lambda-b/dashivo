import { Copy, FileCode2, FilePlus2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/primitives/IconButton";
import { RadioGroup } from "@/components/primitives/RadioGroup";
import { SelectList } from "@/components/primitives/SelectList";
import type {
  AnalysisLogicDefinition,
  ContentDefinition,
  DashboardSchema,
} from "@/schema/dashboard";

type CreationMode = "duplicate" | "existing" | "new";
type ContentType = ContentDefinition["type"];

export interface OutputDefinitionRequest {
  content: ContentDefinition;
  path: string;
  source?: string;
}

interface OutputDefinitionDialogProps {
  currentLogic?: AnalysisLogicDefinition;
  dashboard: DashboardSchema;
  onClose: () => void;
  onCreate: (request: OutputDefinitionRequest) => Promise<void>;
  open: boolean;
  pythonFiles: string[];
}

const modes = [
  {
    description: "新しい.pyファイルと出力定義を同時に作成します。",
    icon: FilePlus2,
    label: "新規ファイル",
    value: "new",
  },
  {
    description: "dashboard/logicにあるファイルを出力定義へ登録します。",
    icon: FileCode2,
    label: "既存ファイル",
    value: "existing",
  },
  {
    description: "選択中のPythonと表示設定を複製して編集を始めます。",
    icon: Copy,
    label: "現在の出力を複製",
    value: "duplicate",
  },
] as const;

const contentTypeOptions = [
  { label: "グラフ", value: "chart" },
  { label: "テーブル", value: "table" },
  { label: "数値カード", value: "metric" },
] as const;

const createDefaultContent = (type: ContentType): ContentDefinition => {
  switch (type) {
    case "metric":
      return { type, title: "新しい数値", format: "number", emphasis: "accent" };
    case "table":
      return { type, title: "新しいテーブル", columns: [{ key: "value", label: "値" }] };
    case "chart":
      return {
        type,
        title: "新しいグラフ",
        chart: { type: "line", x: "label", y: ["value"] },
        formatting: {
          colors: ["#ca2420", "#e85d3f"],
          legend: { visible: false, position: "bottom" },
          gridLines: true,
          xAxis: { title: "", format: "auto", minimum: null, maximum: null },
          yAxis: { title: "", format: "number", minimum: null, maximum: null },
        },
      };
  }
};

const createPythonTemplate = (type: ContentType) => {
  if (type === "metric") {
    return `def execute(inputs, params):
    return 0
`;
  }
  const columns = type === "chart" ? '"label": ["Sample"], "value": [0]' : '"value": [0]';
  return `import pandas as pd


def execute(inputs: dict[str, pd.DataFrame], params: dict):
    result = pd.DataFrame({${columns}})
    return result.to_dict(orient="records")
`;
};

const createFileName = (dashboard: DashboardSchema, pythonFiles: string[]) => {
  const paths = new Set([
    ...pythonFiles,
    ...dashboard.analysis.logic.map((definition) => definition.path),
  ]);
  let index = dashboard.analysis.logic.length + 1;
  while (paths.has(`logic/analysis_${index}.py`)) index += 1;
  return `analysis_${index}.py`;
};

export const OutputDefinitionDialog = ({
  currentLogic,
  dashboard,
  onClose,
  onCreate,
  open,
  pythonFiles,
}: OutputDefinitionDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<CreationMode>("new");
  const [contentType, setContentType] = useState<ContentType>("chart");
  const [fileName, setFileName] = useState(() => createFileName(dashboard, pythonFiles));
  const [existingPath, setExistingPath] = useState(pythonFiles[0] ?? "");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const existingLogic = useMemo(
    () => dashboard.analysis.logic.find((definition) => definition.path === existingPath),
    [dashboard.analysis.logic, existingPath],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setFileName(createFileName(dashboard, pythonFiles));
    setExistingPath(pythonFiles[0] ?? "");
    setError(undefined);
    setSaving(false);
  }, [dashboard, open, pythonFiles]);

  const close = () => {
    if (saving) return;
    onClose();
  };

  const create = async () => {
    const normalizedFileName = fileName.trim();
    if (mode === "new" && !/^[a-z0-9][a-z0-9_-]*\.py$/.test(normalizedFileName)) {
      setError("ファイル名は英小文字、数字、_、-を使い、.pyで終えてください。");
      return;
    }
    if (mode === "existing" && !existingPath) {
      setError("Pythonファイルを選択してください。");
      return;
    }
    if (mode === "duplicate" && !currentLogic) {
      setError("複製元の出力定義がありません。");
      return;
    }

    const request: OutputDefinitionRequest =
      mode === "duplicate" && currentLogic
        ? {
            path: currentLogic.path,
            content: { ...currentLogic.content, title: `${currentLogic.content.title}のコピー` },
          }
        : mode === "existing"
          ? {
              path: existingPath,
              content: existingLogic
                ? { ...existingLogic.content, title: `${existingLogic.content.title}のコピー` }
                : createDefaultContent(contentType),
            }
          : {
              path: `logic/${normalizedFileName}`,
              content: createDefaultContent(contentType),
              source: createPythonTemplate(contentType),
            };

    setSaving(true);
    setError(undefined);
    try {
      await onCreate(request);
      onClose();
    } catch (cause) {
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "出力定義を作成できませんでした。");
    }
  };

  return (
    <dialog
      aria-labelledby="output-definition-title"
      className="m-auto w-[min(46rem,calc(100%-2rem))] rounded-xl border border-stone-200 bg-white p-0 text-stone-800 shadow-2xl backdrop:bg-stone-950/40"
      onClose={close}
      ref={dialogRef}
    >
      <header className="flex items-start justify-between gap-6 border-b border-stone-200 px-6 py-5">
        <div>
          <h3 className="text-lg font-bold" id="output-definition-title">
            出力定義を追加
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Pythonファイルと、その戻り値の表示方法を登録します。
          </p>
        </div>
        <IconButton icon={X} label="出力定義の追加を閉じる" onClick={close} />
      </header>

      <div className="grid gap-5 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {modes.map((item) => {
            const Icon = item.icon;
            const disabled = item.value === "duplicate" && !currentLogic;
            return (
              <button
                aria-pressed={mode === item.value}
                className="aria-pressed:border-brand aria-pressed:bg-brand-soft cursor-pointer rounded-lg border border-stone-200 p-4 text-left transition hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={disabled}
                key={item.value}
                onClick={() => setMode(item.value)}
                type="button"
              >
                <Icon aria-hidden="true" className="text-brand mb-3 size-5" />
                <strong className="block text-sm">{item.label}</strong>
                <span className="mt-1 block text-xs leading-5 text-stone-500">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          {mode === "new" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-stone-600">
                Pythonファイル名
                <input
                  className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-mono text-sm outline-none"
                  onChange={(event) => setFileName(event.target.value)}
                  value={fileName}
                />
                <span className="mt-1 block font-normal text-stone-400">dashboard/logic配下</span>
              </label>
              <fieldset className="text-xs font-medium text-stone-600">
                <legend className="mb-2">出力形式</legend>
                <RadioGroup
                  layout="vertical"
                  name="new-output-type"
                  onChange={(value) => setContentType(value as ContentType)}
                  options={contentTypeOptions}
                  value={contentType}
                />
              </fieldset>
            </div>
          ) : mode === "existing" ? (
            <div className="grid gap-4">
              <label className="text-xs font-medium text-stone-600">
                Pythonファイル
                <div className="mt-1">
                  <SelectList
                    onChange={setExistingPath}
                    options={pythonFiles.map((path) => ({ label: path, value: path }))}
                    value={existingPath}
                  />
                </div>
              </label>
              {existingLogic ? (
                <p className="text-xs leading-5 text-stone-500">
                  このファイルを使用している「{existingLogic.content.title}
                  」の表示設定を引き継ぎます。
                </p>
              ) : (
                <fieldset className="text-xs font-medium text-stone-600">
                  <legend className="mb-2">出力形式</legend>
                  <RadioGroup
                    layout="horizontal"
                    name="existing-output-type"
                    onChange={(value) => setContentType(value as ContentType)}
                    options={contentTypeOptions}
                    value={contentType}
                  />
                </fieldset>
              )}
            </div>
          ) : (
            <dl className="grid gap-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">複製元</dt>
                <dd className="font-semibold">{currentLogic?.content.title}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Pythonファイル</dt>
                <dd className="font-mono">{currentLogic?.path}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-stone-200 px-6 py-4">
        {error ? <p className="text-xs text-red-700">{error}</p> : <span />}
        <button
          className="bg-brand hover:bg-brand-dark cursor-pointer rounded-md px-5 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50"
          disabled={saving || (mode === "existing" && pythonFiles.length === 0)}
          onClick={create}
          type="button"
        >
          {saving ? "作成中…" : "出力定義を作成"}
        </button>
      </footer>
    </dialog>
  );
};
