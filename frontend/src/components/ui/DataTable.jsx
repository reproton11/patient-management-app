// patient-management-app/frontend/src/components/ui/DataTable.jsx
import React from "react";
import { InboxIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/outline";
import Card from "./Card";
import Button from "./Button";

const SortHeader = ({ column, sortBy, sortOrder, onSort }) => {
  const active = sortBy === column.key;
  const ariaSort = active ? (sortOrder === "asc" ? "ascending" : "descending") : undefined;
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${
        column.sortable ? "cursor-pointer select-none" : ""
      }`}
      onClick={column.sortable ? () => onSort(column.key) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {column.label}
        {active && sortOrder === "asc" && (
          <ChevronUpIcon className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
        )}
        {active && sortOrder === "desc" && (
          <ChevronDownIcon className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
        )}
      </span>
    </th>
  );
};

const DataTable = ({
  columns,
  rows,
  rowKey = (row) => row._id ?? row.id,
  sortBy,
  sortOrder,
  onSort,
  emptyMessage = "Tidak ada data yang ditemukan.",
  emptyHint,
  onResetFilters,
  footer,
}) => (
  <Card className="overflow-hidden p-0">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-white/60">
          <tr>
            {columns.map((column) => (
              <SortHeader
                key={column.key}
                column={column}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-white/55">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap px-6 py-3.5 text-sm ${
                    column.align === "center" ? "text-center" : "text-left"
                  } ${column.className || "text-gray-800"}`}
                >
                  {column.render ? column.render(row) : row[column.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {(!rows || rows.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
          <InboxIcon className="h-10 w-10 text-gray-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-gray-700">{emptyMessage}</p>
          {emptyHint ? <p className="text-sm text-gray-500">{emptyHint}</p> : null}
          {onResetFilters ? (
            <Button variant="secondary" size="sm" className="mt-2" onClick={onResetFilters}>
              Reset Filter
            </Button>
          ) : null}
        </div>
      )}
    </div>
    {footer ? <div className="border-t border-gray-100 px-5 py-4">{footer}</div> : null}
  </Card>
);

export default DataTable;