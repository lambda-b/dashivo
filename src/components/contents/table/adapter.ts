import { createColumnHelper, tableFeatures } from "@tanstack/react-table";
import type { DataRow, TableDefinition } from "@/schema/dashboard";

export const tableAdapterFeatures = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableAdapterFeatures, DataRow>();
const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const formatValue = (value: unknown, format?: "currency" | "number") => {
  if (typeof value !== "number") return String(value ?? "");
  if (format === "currency") return currency.format(value);
  return value.toLocaleString("ja-JP");
};

export const createTableColumns = (definition: TableDefinition) =>
  columnHelper.columns(
    definition.columns.map((column) =>
      columnHelper.accessor((row) => row[column.key], {
        id: column.key,
        header: column.label,
        cell: (context) => formatValue(context.getValue(), column.format),
      }),
    ),
  );
