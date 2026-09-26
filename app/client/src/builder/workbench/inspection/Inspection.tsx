import { useState } from "react";
import { Content } from "@/components/contents/DashboardContent";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { InputInspection } from "@/builder/workbench/inspection/InputInspection";
import { Help } from "@/builder/workbench/inspection/Help";
import { useSavedDashboard } from "@/app/context/useDashboard";
import type { AnalysisOutput, ParameterValue } from "@dashlet/shared/dashboard";

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
    <section aria-label="確認エリア" className="min-h-0 min-w-0 overflow-auto bg-stone-50">
      <div
        className="sticky top-0 z-10 flex border-b border-stone-200 bg-white px-5"
        role="tablist"
      >
        {["入力値参照", "出力プレビュー", "ヘルプ"].map((name) => (
          <button
            className="aria-selected:border-brand aria-selected:text-brand cursor-pointer flex-1 border-b-2 border-transparent px-3 py-4 text-xs font-semibold text-stone-500 hover:bg-stone-50"
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
        <div className="space-y-4 p-5">
          <details className="rounded-xl border border-stone-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-bold text-stone-700">
              検証用パラメータ
            </summary>
            <p className="mb-4 mt-3 border-t border-stone-100 pt-3 text-xs text-stone-500">
              変更後に「実行」を押すと反映します。
            </p>
            <ControlPanel controls={dashboard.controls} params={params} onChange={onParams} />
          </details>
          {pending && (
            <p
              role="status"
              className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500"
            >
              Pythonを実行中…
            </p>
          )}
          {error && (
            <pre
              role="alert"
              className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900"
            >
              {error.message}
            </pre>
          )}
          {!output && !pending && !error && (
            <p className="grid h-64 place-items-center rounded-xl border border-stone-200 bg-white text-sm text-stone-500">
              「実行」で出力を確認できます。
            </p>
          )}
          {output && (
            <>
              <Content content={output.view} result={output.data} />
              <details className="rounded-xl border border-stone-200 bg-white p-4">
                <summary className="cursor-pointer text-xs font-bold text-stone-700">
                  出力データ
                </summary>
                <pre className="mt-3 max-h-80 overflow-auto text-[0.6875rem] leading-5 text-stone-600">
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
