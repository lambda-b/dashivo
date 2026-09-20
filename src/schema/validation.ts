import type { AnalysisResults, DashboardSchema, DataRow } from "@/schema/dashboard";

const getMissingColumns = (rows: DataRow[], columns: string[]) => {
  if (rows.length === 0) return [];
  const availableColumns = new Set(rows.flatMap((row) => Object.keys(row)));
  return columns.filter((column) => !availableColumns.has(column));
};

export const validateContentBindings = (
  dashboard: DashboardSchema,
  results: AnalysisResults,
): AnalysisResults => {
  const errors: string[] = [];

  for (const placement of dashboard.tabs.flatMap((tab) => tab.contents)) {
    const logic = dashboard.analysis.logic.find((definition) => definition.id === placement.logic);
    if (!logic) continue;
    const content = logic.content;
    const result = results[placement.logic];
    if (result === undefined) {
      errors.push(
        `Content「${content.title}」のlogic「${placement.logic}」の実行結果がありません。`,
      );
      continue;
    }

    if (content.type === "metric") {
      if (typeof result !== "number") {
        errors.push(`Metric「${content.title}」のPythonロジックは数値を返す必要があります。`);
      }
      continue;
    }

    if (!Array.isArray(result)) {
      errors.push(
        `${content.type === "chart" ? "Chart" : "Table"}「${content.title}」のPythonロジックは行データの配列を返す必要があります。`,
      );
      continue;
    }

    const columns =
      content.type === "chart"
        ? content.chart.type === "pie"
          ? [content.chart.name, content.chart.value]
          : content.chart.type === "scatter"
            ? [content.chart.x, content.chart.y]
            : [content.chart.x, ...content.chart.y]
        : content.columns.map((column) => column.key);
    const missingColumns = getMissingColumns(result, columns);
    if (missingColumns.length > 0) {
      errors.push(
        `${content.type === "chart" ? "Chart" : "Table"}「${content.title}」に必要なcolumnがありません: ${missingColumns.join(", ")}`,
      );
    }
  }

  if (errors.length > 0) throw new Error(errors.join("\n"));
  return results;
};
