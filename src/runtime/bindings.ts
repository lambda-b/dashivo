import type { AnalysisResult, DashboardSchema } from "@/schema/dashboard";

const getMissingColumns = (rows: AnalysisResult["datasets"][string], columns: string[]) => {
  if (rows.length === 0) return [];
  const availableColumns = new Set(rows.flatMap((row) => Object.keys(row)));
  return columns.filter((column) => !availableColumns.has(column));
};

export const validateDatasetBindings = (
  dashboard: DashboardSchema,
  result: AnalysisResult,
): AnalysisResult => {
  const errors: string[] = [];

  for (const visualization of dashboard.visualizations) {
    const rows = result.datasets[visualization.dataset];
    if (!rows) {
      errors.push(
        `Visualization「${visualization.title}」のdataset「${visualization.dataset}」がありません。`,
      );
      continue;
    }

    const missingColumns = getMissingColumns(rows, [visualization.x, ...visualization.y]);
    if (missingColumns.length > 0) {
      errors.push(
        `Visualization「${visualization.title}」に必要なcolumnがありません: ${missingColumns.join(", ")}`,
      );
    }
  }

  for (const table of dashboard.tables) {
    const rows = result.datasets[table.dataset];
    if (!rows) {
      errors.push(`Table「${table.title}」のdataset「${table.dataset}」がありません。`);
      continue;
    }

    const missingColumns = getMissingColumns(
      rows,
      table.columns.map((column) => column.key),
    );
    if (missingColumns.length > 0) {
      errors.push(
        `Table「${table.title}」に必要なcolumnがありません: ${missingColumns.join(", ")}`,
      );
    }
  }

  if (errors.length > 0) throw new Error(errors.join("\n"));
  return result;
};
