import type { AnalysisResults, DashboardSchema } from "@shared/dashboard";

export const validateContentBindings = (dashboard: DashboardSchema, results: AnalysisResults) => {
  for (const { logic } of dashboard.tabs.flatMap((tab) => tab.contents)) {
    if (!(logic in results)) throw new Error(`logic「${logic}」の実行結果がありません。`);
  }

  return results;
};
