import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/primitives/IconButton";
import { RadioGroup } from "@/components/primitives/RadioGroup";
import type { ContentDefinition, DashboardSchema } from "@/schema/dashboard";
import { createUniqueIndexedName } from "@/utils/createUniqueIndexedName";

type ContentType = ContentDefinition["type"];

export interface OutputDefinitionRequest {
  content: ContentDefinition;
  path: string;
  source: string;
}

interface OutputDefinitionDialogProps {
  dashboard: DashboardSchema;
  onClose: () => void;
  onCreate: (request: OutputDefinitionRequest) => Promise<void>;
  pythonFiles: string[];
}

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

export const OutputDefinitionDialog = ({
  dashboard,
  onClose,
  onCreate,
  pythonFiles,
}: OutputDefinitionDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [contentType, setContentType] = useState<ContentType>("chart");
  const [filePath, setFilePath] = useState(() =>
    createUniqueIndexedName(
      [...pythonFiles, ...dashboard.analysis.logic.map((definition) => definition.path)],
      "logic/analysis_",
      ".py",
    ),
  );
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = () => {
    if (!saving) onClose();
  };

  const create = async () => {
    const path = filePath.trim();
    if (!/^logic\/[a-z0-9][a-z0-9_-]*\.py$/.test(path)) {
      setError("logic/配下の.pyファイルを、英小文字、数字、_、-で指定してください。");
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await onCreate({
        path,
        content: createDefaultContent(contentType),
        source: createPythonTemplate(contentType),
      });
      onClose();
    } catch (cause) {
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "出力定義を作成できませんでした。");
    }
  };

  return (
    <dialog
      aria-labelledby="output-definition-title"
      className="m-auto w-[min(38rem,calc(100%-2rem))] rounded-xl border border-stone-200 bg-white p-0 text-stone-800 shadow-2xl backdrop:bg-stone-950/40"
      onClose={close}
      ref={dialogRef}
    >
      <header className="flex items-start justify-between gap-6 border-b border-stone-200 px-6 py-5">
        <div>
          <h3 className="text-lg font-bold" id="output-definition-title">
            出力定義を追加
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            新しいPythonファイルと戻り値の表示方法を作成します。
          </p>
        </div>
        <IconButton icon={X} label="出力定義の追加を閉じる" onClick={close} />
      </header>

      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <label className="text-xs font-medium text-stone-600">
          Pythonファイル
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-mono text-sm outline-none"
            onChange={(event) => setFilePath(event.target.value)}
            value={filePath}
          />
          <span className="mt-1 block font-normal text-stone-400">dashboard/からの相対パス</span>
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

      <footer className="flex items-center justify-between gap-4 border-t border-stone-200 px-6 py-4">
        {error ? <p className="text-xs text-red-700">{error}</p> : <span />}
        <button
          className="bg-brand hover:bg-brand-dark cursor-pointer rounded-md px-5 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50"
          disabled={saving}
          onClick={create}
          type="button"
        >
          {saving ? "作成中…" : "出力定義を作成"}
        </button>
      </footer>
    </dialog>
  );
};
