import { useEffect, useRef, useState } from "react";
import { useSavedDashboard } from "@/app/context/useDashboard";
import { saveDashboard } from "@/builder/api/dashboard";
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
  const [id, setId] = useState(() =>
    createUniqueIndexedName(
      [
        ...dashboard.analysis.logic.map((logic) => logic.id),
        ...files.map((path) => path.replace(/^logic\//, "").replace(/\.py$/, "")),
      ],
      "logic-",
    ),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const create = async () => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      setError("IDは英小文字・数字・ハイフンで指定してください。");
      return;
    }
    setSaving(true);
    try {
      await saveDashboard({
        logic: {
          id,
          path: `logic/${id}.py`,
          source: `from dashlet import plot


def execute(inputs, params):
    return plot.metric(0).title("新しい数値")
`,
        },
      });
      onCreated(id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "作成できませんでした。");
      setSaving(false);
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
      className="m-auto w-96 rounded-xl p-6 backdrop:bg-black/40"
    >
      <h2 className="mb-4 font-bold">ロジックを追加</h2>
      <label>
        Logic ID
        <input
          className="my-2 w-full rounded border p-2"
          value={id}
          onChange={(event) => setId(event.target.value)}
        />
      </label>
      <p className="text-xs">Pythonファイル: logic/{id}.py</p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-3">
        <button disabled={saving} onClick={onClose}>
          キャンセル
        </button>
        <button
          disabled={saving}
          className="rounded bg-red-700 px-4 py-2 text-white"
          onClick={create}
        >
          {saving ? "保存中…" : "作成"}
        </button>
      </div>
    </dialog>
  );
};
