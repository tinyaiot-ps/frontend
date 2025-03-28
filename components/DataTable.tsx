/** @format */
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  getFilteredRowModel,
  getSortedRowModel,
  FilterFn,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Info, ArrowUpDown, MoveUp, MoveDown } from "lucide-react";
import { useTranslation } from "@/lib/TranslationContext";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  showSearchBar: boolean;
  showExportButton: boolean;
  data: TData[];
  onRowClick?: (row: TData) => void;
  selectedRows?: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  showSearchBar = true,
  showExportButton = true,
  data,
  onRowClick,
  selectedRows,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const { t } = useTranslation();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const fuzzyFilter: FilterFn<TData> = (row, columnId, value) => {
    const cellValue = row.getValue(columnId);
    return String(cellValue).toLowerCase().includes(value.toLowerCase());
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    filterFns: {
      fuzzyName: fuzzyFilter,
      fuzzyLocation: fuzzyFilter,
      fuzzyIdentifier: fuzzyFilter,
    },
    debugTable: false, // Optional: Enable debugging to see console logs
  });

  const makeCSV = () => {
    // Get the column ids for CSV headers
    const columnIds = columns.map((col) => {
      if ('accessorKey' in col && col.accessorKey) {
        return col.accessorKey as string;
      } else if ('id' in col && col.id) {
        return col.id as string;
      } else {
        return '';
      }
    }).filter(id => id !== '');
  
    // Generate CSV content
    const csvContent = [
      columnIds.join(","), // Header row
      ...data.map((item) => {
        return columnIds
          .map((field) => `"${item[field as keyof TData] || ""}"`)
          .join(",");
      }),
    ].join("\n");
  
    // Create Blob and download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "data.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };  

   return (
    <div>
      {showSearchBar && (
        <div className="flex items-center py-4 px-1">
          <Input
            placeholder="Search..."
            value={table.getState().globalFilter}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <span className="text-blue-500 info-tooltip">
            <Info className="text-gray-500 ml-4 mr-2" />
            <span className="info-tooltip-text">Search by name, location, or identifier.</span>
          </span>
          <span className="text-blue-500 info-tooltip">
            <ArrowUpDown className="text-gray-500 ml-4 mr-2" />
            <span className="info-tooltip-text">Sort by clicking on the column headers.</span>
          </span>
          { showExportButton && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => makeCSV()}
            >
              Export to CSV
            </Button>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={
                    header.column.getIsSorted()
                      ? header.column.getIsSorted() === "asc"
                        ? "sort-asc"
                        : "sort-desc"
                      : ""
                  }
                >
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        header.column.getIsSorted() === "asc" ? (
                          <MoveUp className="ml-1 h-[18px]" />
                        ) : (
                          <MoveDown className="ml-1 h-[18px]" />
                        )
                      )}
                    </div>
                  )}
                </TableHead>
                
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={() =>
                    onRowClick ? onRowClick(row.original) : undefined
                  }
                  className={
                    selectedRows && selectedRows.includes(row.original)
                      ? "bg-gray-200"
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
