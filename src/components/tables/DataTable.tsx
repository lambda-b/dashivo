import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import type { DataRow, TableDefinition } from "@/schema/dashboard";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, DataRow>();
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

interface DataTableProps {
  definition: TableDefinition;
  data: DataRow[];
}

export const DataTable = ({ definition, data }: DataTableProps) => {
  const columns = useMemo(
    () =>
      columnHelper.columns(
        definition.columns.map((column) =>
          columnHelper.accessor((row) => row[column.key], {
            id: column.key,
            header: column.label,
            cell: (context) => formatValue(context.getValue(), column.format),
          }),
        ),
      ),
    [definition.columns],
  );
  const table = useTable({ features, columns, data });

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-300 bg-white/70">
      <div className="border-b border-stone-200 p-6">
        <p className="mb-2 text-xs font-bold tracking-[0.15em] text-stone-500">TANSTACK TABLE</p>
        <h2 className="text-2xl font-bold tracking-tight">{definition.title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    className="border-b border-stone-200 px-6 py-4 text-right text-xs font-semibold text-stone-500 first:text-left"
                    key={header.id}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell) => (
                  <td
                    className="border-b border-stone-200 px-6 py-4 text-right text-sm tabular-nums first:text-left"
                    key={cell.id}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
