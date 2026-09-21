import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSavedDashboard } from "@/app/context/useDashboard";
import { analysisPort, loadInputs } from "@/ports/analysis";
import { SelectList } from "@/components/primitives/SelectList";

export const InputInspection = () => {
  const dashboard = useSavedDashboard();
  const inputs = dashboard.analysis.inputs;

  const [selected, setSelected] = useState(inputs[0]?.id ?? "");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const current = inputs.find((input) => input.id === selected) ?? inputs[0];
  const query = useQuery({
    queryKey: ["input-preview", inputs],
    queryFn: async () => analysisPort.inspect(await loadInputs(dashboard.analysis)),
  });
  const rows = current ? (query.data?.[current.id] ?? []) : [];
  const columns = Object.keys(rows[0] ?? {});

  const copy = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(reference);
      setError("");
    } catch {
      setError("クリップボードへコピーできませんでした。参照式を選択してコピーしてください。");
    }
  };

  return (
    <div className="m-5 grid gap-4 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-bold text-stone-700">CSV（先頭5件）</h3>
      {current && (
        <>
          <SelectList
            ariaLabel="プレビューするCSV"
            value={current.id}
            onChange={setSelected}
            options={inputs.map((input) => ({
              value: input.id,
              label: input.id + " (" + input.path + ")",
            }))}
          />
          <button
            className="cursor-pointer break-all text-left font-mono text-xs text-indigo-700 hover:underline"
            onClick={() => copy(`inputs[${JSON.stringify(current.id)}]`)}
          >
            {`inputs[${JSON.stringify(current.id)}]`} をコピー
          </button>
        </>
      )}
      {query.isError ? (
        <p role="alert">{query.error.message}</p>
      ) : query.isPending ? (
        <p>CSVを読み込み中…</p>
      ) : (
        <div className="overflow-auto rounded-md border border-stone-200">
          <table className="w-full min-w-max border-collapse text-xs">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                {columns.map((key) => (
                  <th className="border-b border-stone-200 px-3 py-2 text-left" key={key}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((key) => (
                    <td
                      className="border-b border-stone-100 px-3 py-2 font-mono text-stone-600"
                      key={key}
                    >
                      {String(row[key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h3 className="border-t border-stone-100 pt-4 text-sm font-bold text-stone-700">
        利用可能なParameters
      </h3>
      {dashboard.controls.map((control) => (
        <div className="min-w-0 rounded-md bg-stone-50 px-3 py-2" key={control.key}>
          <button
            className="cursor-pointer break-all text-left font-mono text-xs text-indigo-700 hover:underline"
            onClick={() => copy(`params[${JSON.stringify(control.key)}]`)}
          >
            {`params[${JSON.stringify(control.key)}]`} をコピー
          </button>
          <p className="mt-1 break-all text-[0.6875rem] leading-5 text-stone-500">
            {control.displayName} · {JSON.stringify(control.defaultValue)}
          </p>
        </div>
      ))}
      {copied && (
        <p role="status" className="break-all text-xs">
          {copied} をコピーしました
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
};
