"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, searchable = false, searchPlaceholder = "Search...",
  searchKeys = [], pageSize = 10, onRowClick, emptyMessage = "No data found.",
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = [...data];
    if (search && searchKeys.length > 0) {
      const term = search.toLowerCase();
      result = result.filter(row =>
        searchKeys.some(key => String(row[key] ?? "").toLowerCase().includes(term))
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {searchable && (
        <div className="px-4 py-3 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b">
              {columns.map(col => (
                <th key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                    col.sortable && "cursor-pointer hover:text-foreground select-none",
                    col.className
                  )}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">{emptyMessage}</td></tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={i}
                  onClick={() => onRowClick?.(row)}
                  className={cn("hover:bg-slate-50/80 transition-colors", onRowClick && "cursor-pointer")}
                >
                  {columns.map(col => (
                    <td key={col.key}
                      className={cn("px-4 py-3", col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left", col.className)}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-1.5 border rounded-lg disabled:opacity-30 hover:bg-slate-50 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = totalPages <= 5 ? i + 1
                : currentPage <= 3 ? i + 1
                : currentPage >= totalPages - 2 ? totalPages - 4 + i
                : currentPage - 2 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={cn("w-8 h-8 rounded-lg text-xs font-semibold transition",
                    currentPage === page ? "bg-indigo-600 text-white" : "hover:bg-slate-100"
                  )}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-1.5 border rounded-lg disabled:opacity-30 hover:bg-slate-50 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
