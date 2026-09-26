import {
  analysisResultsSchema,
  type AnalysisResults,
  type DashboardSchema,
} from "@dashlet/shared/dashboard";

export const validateContentBindings = (dashboard: DashboardSchema, results: AnalysisResults) => {
  analysisResultsSchema.parse(results);

  for (const { logic } of dashboard.tabs.flatMap((tab) => tab.contents)) {
    if (!(logic in results)) throw new Error(`logic「${logic}」の実行結果がありません。`);
  }

  return results;
};
