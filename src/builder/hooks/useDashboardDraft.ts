import { useReducer } from "react";
import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";

const dashboardEditorEndpoint = "/__dashlet/dashboard";

const saveDashboardFile = async (dashboard: DashboardSchema): Promise<void> => {
  const response = await fetch(dashboardEditorEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dashboard),
  });

  if (response.ok) return;
  const result: unknown = await response.json();
  const message =
    typeof result === "object" && result !== null && "error" in result
      ? String(result.error)
      : "dashboard.jsonを保存できませんでした。";
  throw new Error(message);
};

interface DashboardDraftState {
  draft: DashboardSchema;
  dashboard: DashboardSchema;
  revision: number;
  saveStatus: "idle" | "saving" | "saved";
  error?: string;
}

type DashboardDraftAction =
  | { type: "edit"; dashboard: DashboardSchema }
  | { type: "apply"; dashboard: DashboardSchema }
  | { type: "saving" }
  | { type: "saved" }
  | { type: "error"; message: string };

const createState = (dashboard: DashboardSchema): DashboardDraftState => ({
  draft: dashboard,
  dashboard,
  revision: 0,
  saveStatus: "idle",
});

const reducer = (state: DashboardDraftState, action: DashboardDraftAction): DashboardDraftState => {
  switch (action.type) {
    case "edit":
      return { ...state, draft: action.dashboard, saveStatus: "idle", error: undefined };
    case "apply":
      return {
        draft: action.dashboard,
        dashboard: action.dashboard,
        revision: state.revision + 1,
        saveStatus: "idle",
      };
    case "saving":
      return { ...state, saveStatus: "saving", error: undefined };
    case "saved":
      return { ...state, saveStatus: "saved", error: undefined };
    case "error":
      return { ...state, saveStatus: "idle", error: action.message };
  }
};

export const useDashboardDraft = (initialDashboard: DashboardSchema) => {
  const [state, dispatch] = useReducer(reducer, initialDashboard, createState);

  const editDashboard = (dashboard: DashboardSchema) => dispatch({ type: "edit", dashboard });

  const runWithValidDraft = async (
    action: (dashboard: DashboardSchema) => void | Promise<void>,
  ) => {
    try {
      await action(dashboardSchema.parse(state.draft));
    } catch (error) {
      dispatch({
        type: "error",
        message: error instanceof Error ? error.message : "設定を処理できませんでした。",
      });
    }
  };

  const applyDraft = () => runWithValidDraft((dashboard) => dispatch({ type: "apply", dashboard }));

  const saveDraft = () =>
    runWithValidDraft(async (dashboard) => {
      dispatch({ type: "saving" });
      await saveDashboardFile(dashboard);
      dispatch({ type: "saved" });
    });

  const resetDraft = () => dispatch({ type: "apply", dashboard: initialDashboard });

  return { state, editDashboard, applyDraft, saveDraft, resetDraft };
};
