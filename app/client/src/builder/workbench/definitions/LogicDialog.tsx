import { useEffect, useRef, useState } from "react";
import { useDashboardId, useSavedDashboard } from "@/app/context/useDashboard";
import { useCreatePythonLogic } from "@/builder/hooks/useCreatePythonLogic";
import { createUniqueIndexedName } from "@/utils/createUniqueIndexedName";

export const LogicDialog = ({
  onClose,
  onCreated,
  files,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  files: string[];
}) => {
  const dashboard = useSavedDashboard();
  const dashboardId = useDashboardId();

  const [id, setId] = useState(() =>
    createUniqueIndexedName(
      [
        ...dashboard.analysis.logic.map((logic) => logic.id),
        ...files
          .filter((path) => path.startsWith(`logic/${dashboardId}/`))
          .map((path) => path.replace(`logic/${dashboardId}/`, "").replace(/\.py$/, "")),
      ],
      "logic-",
    ),
  );
  const [error, setError] = useState("");
  const createLogic = useCreatePythonLogic();
  const saving = createLogic.isPending;
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const create = async () => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      setError("IDは英小文字・数字・ハイフンで指定してください。");
      return;
    }

    setError("");
    try {
      await createLogic.mutateAsync({
        id,
        path: `logic/${dashboardId}/${id}.py`,
        source: `from dashlet import plot


def execute(inputs, params):
    fig = plot.metric(0)
    fig.title("新しい数値")
    return fig
`,
      });
      onCreated(id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "作成できませんでした。");
    }
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
      aria-label="ロジックを追加"
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-stone-200 bg-white p-6 text-stone-800 shadow-2xl backdrop:bg-stone-950/45"
    >
      <h2 className="mb-5 text-xl font-bold">ロジックを追加</h2>
      <label className="text-xs font-medium text-stone-600">
        Logic ID
        <input
          className="focus:border-brand my-2 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
          value={id}
          onChange={(event) => setId(event.target.value)}
        />
      </label>
      <p className="break-all font-mono text-xs text-stone-500">
        Pythonファイル: logic/{dashboardId}/{id}.py
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-3 border-t border-stone-100 pt-4">
        <button
          className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          disabled={saving}
          onClick={onClose}
        >
          キャンセル
        </button>
        <button
          disabled={saving}
          className="bg-brand hover:bg-brand-dark cursor-pointer rounded-md px-4 py-2 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-50"
          onClick={create}
        >
          {saving ? "保存中…" : "作成"}
        </button>
      </div>
    </dialog>
  );
};
