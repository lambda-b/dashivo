import type { DashboardSchema } from "@/schema/dashboard";

export interface BuilderState {
  draft: DashboardSchema;
  dashboard: DashboardSchema;
  revision: number;
  error?: string;
}

type BuilderAction =
  | { type: "edit"; dashboard: DashboardSchema }
  | { type: "apply"; dashboard: DashboardSchema }
  | { type: "reset"; dashboard: DashboardSchema }
  | { type: "error"; message: string };

export const createBuilderState = (dashboard: DashboardSchema): BuilderState => ({
  draft: dashboard,
  dashboard,
  revision: 0,
});

export const builderReducer = (state: BuilderState, action: BuilderAction): BuilderState => {
  switch (action.type) {
    case "edit":
      return { ...state, draft: action.dashboard, error: undefined };
    case "apply":
      return {
        draft: action.dashboard,
        dashboard: action.dashboard,
        revision: state.revision + 1,
      };
    case "reset":
      return {
        draft: action.dashboard,
        dashboard: action.dashboard,
        revision: state.revision + 1,
      };
    case "error":
      return { ...state, error: action.message };
  }
};
