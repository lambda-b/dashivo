import type { DashboardSchema } from "@/schema/dashboard";

export interface BuilderState {
  draft: DashboardSchema;
  dashboard: DashboardSchema;
  revision: number;
  saveStatus: "idle" | "saving" | "saved";
  error?: string;
}

type BuilderAction =
  | { type: "edit"; dashboard: DashboardSchema }
  | { type: "apply"; dashboard: DashboardSchema }
  | { type: "reset"; dashboard: DashboardSchema }
  | { type: "saving" }
  | { type: "saved" }
  | { type: "error"; message: string };

export const createBuilderState = (dashboard: DashboardSchema): BuilderState => ({
  draft: dashboard,
  dashboard,
  revision: 0,
  saveStatus: "idle",
});

export const builderReducer = (state: BuilderState, action: BuilderAction): BuilderState => {
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
    case "reset":
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
