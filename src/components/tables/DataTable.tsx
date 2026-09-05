import { useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { createTableColumns, tableAdapterFeatures } from "@/components/tables/adapter";
import type { DataRow, TableDefinition } from "@/schema/dashboard";

interface DataTableProps {
  definition: TableDefinition;
  data: DataRow[];
}

export const DataTable = ({ definition, data }: DataTableProps) => {
  const columns = useMemo(() => createTableColumns(definition), [definition]);
  const table = useTable({ features: tableAdapterFeatures, columns, data });

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
