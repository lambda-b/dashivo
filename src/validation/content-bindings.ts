import type { AnalysisResult, DashboardSchema } from "@/schema/dashboard";

const getMissingColumns = (rows: AnalysisResult["datasets"][string], columns: string[]) => {
  if (rows.length === 0) return [];
  const availableColumns = new Set(rows.flatMap((row) => Object.keys(row)));
  return columns.filter((column) => !availableColumns.has(column));
};

export const validateContentBindings = (
  dashboard: DashboardSchema,
  result: AnalysisResult,
): AnalysisResult => {
  const errors: string[] = [];

  for (const content of dashboard.tabs.flatMap((tab) => tab.contents)) {
    if (content.type === "metric") {
      if (!(content.metric in result.metrics)) {
        errors.push(`Metric「${content.title}」の値「${content.metric}」がありません。`);
      }
      continue;
    }

    const rows = result.datasets[content.dataset];
    if (!rows) {
      errors.push(
        `${content.type === "chart" ? "Chart" : "Table"}「${content.title}」のdataset「${content.dataset}」がありません。`,
      );
      continue;
    }

    const columns =
      content.type === "chart"
        ? [content.chart.x, ...content.chart.y]
        : content.columns.map((column) => column.key);
    const missingColumns = getMissingColumns(rows, columns);
    if (missingColumns.length > 0) {
      errors.push(
        `${content.type === "chart" ? "Chart" : "Table"}「${content.title}」に必要なcolumnがありません: ${missingColumns.join(", ")}`,
      );
    }
  }

  if (errors.length > 0) throw new Error(errors.join("\n"));
  return result;
};
