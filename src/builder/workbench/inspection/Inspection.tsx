import { useState } from "react";
import { Content } from "@/components/contents/DashboardContent";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { InputInspection } from "@/builder/workbench/inspection/InputInspection";
import { Help } from "@/builder/workbench/inspection/Help";
import { useSavedDashboard } from "@/app/context/useDashboard";
import type { AnalysisOutput, ParameterValue } from "@/schema/dashboard";
export const Inspection = ({
  output,
  error,
  pending,
  params,
  onParams,
}: {
  output?: AnalysisOutput;
  error?: Error | null;
  pending: boolean;
  params: Record<string, ParameterValue>;
  onParams: (key: string, value: ParameterValue) => void;
}) => {
  const [tab, setTab] = useState("出力プレビュー");
  const dashboard = useSavedDashboard();
  return (
    <section aria-label="確認エリア" className="min-h-0 overflow-auto bg-stone-50">
      <div className="sticky top-0 z-10 flex border-b bg-white" role="tablist">
        {["入力値参照", "出力プレビュー", "ヘルプ"].map((name) => (
          <button
            className="flex-1 p-3 text-sm aria-selected:border-b-2 aria-selected:border-red-700"
            role="tab"
            aria-selected={name === tab}
            key={name}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === "入力値参照" ? (
        <InputInspection />
      ) : tab === "ヘルプ" ? (
        <Help />
      ) : (
        <div className="space-y-4 p-4">
          <details>
            <summary className="cursor-pointer font-bold">検証用パラメータ</summary>
            <p className="my-2 text-xs">変更後に「実行」を押すと反映します。</p>
            <ControlPanel controls={dashboard.controls} params={params} onChange={onParams} />
          </details>
          {pending && <p role="status">Pythonを実行中…</p>}
          {error && (
            <pre
              role="alert"
              className="whitespace-pre-wrap rounded bg-red-50 p-3 text-xs text-red-800"
            >
              {error.message}
            </pre>
          )}
          {!output && !pending && !error && <p>「実行」で出力を確認できます。</p>}
          {output && (
            <>
              <Content content={output.view} result={output.data} />
              <details>
                <summary>出力データ</summary>
                <pre className="overflow-auto text-xs">
                  {JSON.stringify(
                    Array.isArray(output.data) ? output.data.slice(0, 20) : output.data,
                    null,
                    2,
                  )}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </section>
  );
};
