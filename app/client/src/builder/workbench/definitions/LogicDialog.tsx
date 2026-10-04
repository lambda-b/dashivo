import { useState } from "react";
import { Dialog } from "@/components/primitives/Dialog";
import { Button } from "@/components/primitives/Button";
import { FormField } from "@/components/primitives/FormField";
import { TextInput } from "@/components/primitives/TextInput";
import { useDashboardId, useSavedDashboard } from "@/app/context/useDashboard";
import { useCreatePythonLogic } from "@/builder/hooks/useCreatePythonLogic";
import { createUniqueIndexedName } from "@dashlet/shared-utils/createUniqueIndexedName";
import { messages } from "@/messages";

const defaultSource = `from dashlet import plot

def execute(inputs, params):
    fig = plot.metric(0)
    fig.title("新しい数値")
    return fig
`;

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
  const create = () => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      setError(messages.logic.invalidId);
      return;
    }

    setError("");
    createLogic.mutate(
      {
        id,
        path: `logic/${dashboardId}/${id}.py`,
        source: defaultSource,
      },
      {
        onSuccess: () => {
          onCreated(id);
          onClose();
        },
      },
    );
  };

  return (
    <Dialog
      open
      title="ロジックを追加"
      closeLabel="ロジック追加を閉じる"
      size="small"
      dismissDisabled={saving}
      onClose={onClose}
      footer={
        <>
          <Button disabled={saving} onClick={onClose}>
            キャンセル
          </Button>
          <Button pending={saving} onClick={create} variant="primary">
            {saving ? "保存中…" : "作成"}
          </Button>
        </>
      }
    >
      <FormField label="Logic ID">
        <TextInput monospace value={id} onChange={setId} />
      </FormField>
      <p className="mt-2 break-all font-mono text-xs text-stone-500">
        Pythonファイル: logic/{dashboardId}/{id}.py
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </Dialog>
  );
};
