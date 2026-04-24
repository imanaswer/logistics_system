# LogisticsERP UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire LogisticsERP frontend with a unified design system, persistent sidebar navigation, rich data visualizations, and professional enterprise styling.

**Architecture:** Build a shared component library (sidebar, stat cards, data tables, status badges, loading skeletons) in `components/`, update `app/layout.tsx` to wrap authenticated pages in a sidebar layout, then rewrite each page to use the shared components and new design tokens. Charts use recharts (already installed). No backend changes.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3, shadcn/ui (new-york style), recharts 3, react-select 5, lucide-react, framer-motion

---

### Task 1: Install Dependencies & Set Up shadcn/ui Foundation

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/components.json`
- Create: `frontend/lib/utils.ts`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Install shadcn/ui dependencies**

```bash
cd /Users/anaswerajay/CODE/logistics_system/frontend
npm install clsx tailwind-merge lucide-react class-variance-authority
```

- [ ] **Step 2: Create lib/utils.ts**

```bash
mkdir -p /Users/anaswerajay/CODE/logistics_system/frontend/lib
```

Create `frontend/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Update components.json for correct paths**

Update `frontend/components.json` — change `tsx` to `true`, fix CSS path:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 4: Update globals.css with design system CSS variables**

Replace `frontend/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 100%;
    --secondary: 215 25% 27%;
    --secondary-foreground: 0 0% 100%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 350 89% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 239 84% 67%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@media print {
  .no-print { display: none !important; }
}
```

- [ ] **Step 5: Verify build compiles**

```bash
cd /Users/anaswerajay/CODE/logistics_system/frontend && npx next build 2>&1 | tail -5
```

Expected: Build succeeds or only page-level warnings (not config errors).

- [ ] **Step 6: Commit**

```bash
cd /Users/anaswerajay/CODE/logistics_system/frontend
git add lib/utils.ts components.json app/globals.css tailwind.config.js package.json package-lock.json
git commit -m "feat: set up shadcn/ui foundation with design tokens"
```

---

### Task 2: Build Shared UI Components

**Files:**
- Create: `frontend/components/ui/stat-card.tsx`
- Create: `frontend/components/ui/status-badge.tsx`
- Create: `frontend/components/ui/data-table.tsx`
- Create: `frontend/components/ui/page-header.tsx`
- Create: `frontend/components/ui/loading-skeleton.tsx`
- Create: `frontend/components/ui/empty-state.tsx`

- [ ] **Step 1: Create StatCard component**

Create `frontend/components/ui/stat-card.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  variant?: "default" | "success" | "danger" | "info";
}

const variantStyles = {
  default: "bg-white border-slate-200",
  success: "bg-emerald-50 border-emerald-200",
  danger: "bg-rose-50 border-rose-200",
  info: "bg-indigo-50 border-indigo-200",
};

const iconVariantStyles = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-600",
  danger: "bg-rose-100 text-rose-600",
  info: "bg-indigo-100 text-indigo-600",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, className, variant = "default" }: StatCardProps) {
  return (
    <div className={cn("p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow", variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-lg", iconVariantStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded",
            trend.value >= 0 ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create StatusBadge component**

Create `frontend/components/ui/status-badge.tsx`:

```tsx
import { cn } from "@/lib/utils";

type BadgeVariant = "pending" | "active" | "completed" | "cancelled" | "paid" | "unpaid" | "partial"
  | "credit" | "debit" | "sea" | "air" | "land" | "invoice";

const variants: Record<BadgeVariant, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  unpaid: "bg-rose-100 text-rose-700 border-rose-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
  credit: "bg-emerald-100 text-emerald-700 border-emerald-200",
  debit: "bg-rose-100 text-rose-700 border-rose-200",
  sea: "bg-cyan-100 text-cyan-700 border-cyan-200",
  air: "bg-indigo-100 text-indigo-700 border-indigo-200",
  land: "bg-orange-100 text-orange-700 border-orange-200",
  invoice: "bg-purple-100 text-purple-700 border-purple-200",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Create DataTable component**

Create `frontend/components/ui/data-table.tsx`:

```tsx
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
```

- [ ] **Step 4: Create PageHeader component**

Create `frontend/components/ui/page-header.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Create LoadingSkeleton component**

Create `frontend/components/ui/loading-skeleton.tsx`:

```tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b"><Skeleton className="h-9 w-64" /></div>
      <div className="p-4 space-y-3">
        {[...Array(rows)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create EmptyState component**

Create `frontend/components/ui/empty-state.tsx`:

```tsx
import { cn } from "@/lib/utils";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="p-4 rounded-full bg-slate-100 mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add components/ lib/
git commit -m "feat: add shared UI components (StatCard, StatusBadge, DataTable, PageHeader, skeletons)"
```

---

### Task 3: Build Sidebar Navigation & Auth Layout

**Files:**
- Create: `frontend/components/sidebar.tsx`
- Create: `frontend/components/auth-layout.tsx`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `frontend/components/sidebar.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Plus, FileText, ArrowLeftRight,
  BarChart3, BookOpen, ChevronLeft, LogOut, Menu, X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Jobs", icon: Briefcase,
    children: [
      { label: "All Jobs", href: "/jobs" },
      { label: "New Job", href: "/jobs/new" },
    ],
  },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  {
    label: "Reports", icon: BarChart3,
    children: [
      { label: "Statements", href: "/reports" },
      { label: "Ledger", href: "/reports/ledger" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) setUsername(user);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (confirm("Sign out?")) {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: typeof navItems[0]) => {
    const Icon = item.icon;
    const hasChildren = "children" in item && item.children;
    const active = hasChildren
      ? item.children!.some(c => isActive(c.href))
      : isActive(item.href!);
    const groupOpen = openGroup === item.label;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => setOpenGroup(groupOpen ? null : item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronLeft className={cn("w-4 h-4 transition-transform", groupOpen && "-rotate-90")} />
              </>
            )}
          </button>
          {!collapsed && groupOpen && (
            <div className="ml-8 mt-1 space-y-0.5">
              {item.children!.map(child => (
                <Link key={child.href} href={child.href}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(child.href) ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}>
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link key={item.href} href={item.href!}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
        )}>
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">Logistics<span className="text-indigo-600">ERP</span></span>
              <p className="text-[10px] text-muted-foreground leading-none">SPEED INTERNATIONAL</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition hidden lg:block">
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map(renderNavItem)}
      </nav>

      <div className="p-3 border-t">
        <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase shrink-0">
            {username[0]}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate capitalize">{username}</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online
              </p>
            </div>
          )}
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border shadow-sm no-print">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r bg-white shrink-0 transition-all duration-200 no-print",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Create AuthLayout wrapper**

Create `frontend/components/auth-layout.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { PageSkeleton } from "./ui/loading-skeleton";

const PUBLIC_PATHS = ["/login"];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isInvoiceView = pathname.match(/^\/invoices\/\d+\/view$/);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthed(!!token);
    setChecking(false);
  }, [pathname]);

  if (isPublic) return <>{children}</>;

  if (checking) return <PageSkeleton />;

  if (!authed) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return <PageSkeleton />;
  }

  if (isInvoiceView) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Update root layout to use AuthLayout**

Replace `frontend/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthLayout } from "@/components/auth-layout";

export const metadata: Metadata = {
  title: "Logistics ERP System",
  description: "Complete enterprise logistics management system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify the app loads with sidebar**

```bash
cd /Users/anaswerajay/CODE/logistics_system/frontend && npx next build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add components/sidebar.tsx components/auth-layout.tsx app/layout.tsx
git commit -m "feat: add persistent sidebar navigation and auth layout"
```

---

### Task 4: Redesign Login Page

**Files:**
- Modify: `frontend/app/login/page.tsx`

- [ ] **Step 1: Rewrite login page**

Replace the full content of `frontend/app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { User, Lock, Loader2 } from "lucide-react";
import { API_URL } from "../config";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username);
        window.location.href = "/";
      } else {
        throw new Error("No token received");
      }
    } catch {
      setError("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      <div className="hidden lg:flex w-3/5 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 border border-white/20 rounded-full" />
          <div className="absolute bottom-32 right-16 w-96 h-96 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-white/15 rounded-full" />
        </div>
        <div className="relative z-10 text-center px-10 max-w-lg">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur p-3 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">SPEED INTERNATIONAL</h1>
          <p className="text-lg text-indigo-200 font-medium mb-2">Business LLC</p>
          <p className="text-indigo-300/80 text-sm leading-relaxed">
            Enterprise logistics management — shipments, invoicing, and financial reporting in one place.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Logistics<span className="text-indigo-600">ERP</span></h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" required value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">Secured with enterprise authentication</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: redesign login page with indigo gradient and icons"
```

---

### Task 5: Redesign Dashboard Page

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Rewrite dashboard**

Replace the full content of `frontend/app/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "./config";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import {
  DollarSign, Briefcase, Users, AlertCircle,
  Plus, Eye, FileText, Trash2, MoreVertical,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

interface Job {
  id: number;
  job_date: string;
  client?: { name: string; phone: string };
  client_details?: { name: string; phone: string };
  transport_mode: string;
  port_loading: string;
  port_discharge: string;
  is_finished?: boolean;
}

interface Transaction {
  id: number;
  trans_type: string;
  amount: number;
  date: string;
  client_name?: string;
}

interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  timestamp: string;
}

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#F43F5E"];

export default function Dashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const config = { headers: { Authorization: `Token ${token}` } };

    Promise.all([
      axios.get(`${API_URL}/api/jobs/`, config),
      axios.get(`${API_URL}/api/transactions/`, config),
      axios.get(`${API_URL}/api/audit-logs/`, config),
    ]).then(([jobsRes, transRes, auditRes]) => {
      setJobs(jobsRes.data);
      setTransactions(transRes.data);
      setAuditLogs(auditRes.data);
      setLoading(false);
    }).catch((err: any) => {
      if (err.response?.status === 401) { localStorage.clear(); window.location.href = "/login"; }
    });

    const handleClick = () => setActiveMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const totalReceived = useMemo(() =>
    transactions.filter(t => ["CR", "BR"].includes(t.trans_type)).reduce((s, t) => s + Number(t.amount), 0),
  [transactions]);

  const totalPaid = useMemo(() =>
    transactions.filter(t => ["CP", "BP"].includes(t.trans_type)).reduce((s, t) => s + Number(t.amount), 0),
  [transactions]);

  const netBalance = totalReceived - totalPaid;

  const clientCount = useMemo(() => {
    const names = new Set(jobs.map(j => j.client?.name || j.client_details?.name).filter(Boolean));
    return names.size;
  }, [jobs]);

  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {};
    transactions.forEach(t => {
      if (["CR", "BR"].includes(t.trans_type)) {
        const month = t.date?.substring(0, 7);
        if (month) months[month] = (months[month] || 0) + Number(t.amount);
      }
    });
    return Object.entries(months).sort().slice(-12).map(([month, amount]) => ({
      month: new Date(month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
      amount: Math.round(amount),
    }));
  }, [transactions]);

  const transportModes = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => { counts[j.transport_mode] = (counts[j.transport_mode] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [jobs]);

  const monthlyTxns = useMemo(() => {
    const months: Record<string, { credits: number; debits: number }> = {};
    transactions.forEach(t => {
      const month = t.date?.substring(0, 7);
      if (!month) return;
      if (!months[month]) months[month] = { credits: 0, debits: 0 };
      if (["CR", "BR"].includes(t.trans_type)) months[month].credits += Number(t.amount);
      else if (["CP", "BP"].includes(t.trans_type)) months[month].debits += Number(t.amount);
    });
    return Object.entries(months).sort().slice(-6).map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("en", { month: "short" }),
      credits: Math.round(data.credits),
      debits: Math.round(data.debits),
    }));
  }, [transactions]);

  const handleDeleteJob = async (id: number) => {
    if (!confirm("Delete this job and its invoice?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/jobs/${id}/`, { headers: { Authorization: `Token ${token}` } });
      setJobs(jobs.filter(j => j.id !== id));
    } catch { alert("Delete failed."); }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Overview of logistics operations and financial health.">
        <Link href="/jobs/new">
          <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Job
          </button>
        </Link>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`${totalReceived.toLocaleString()} OMR`} icon={DollarSign} variant="success"
          subtitle={`${totalPaid.toLocaleString()} OMR paid out`} />
        <StatCard title="Outstanding" value={`${netBalance.toLocaleString()} OMR`} icon={AlertCircle}
          variant={netBalance < 0 ? "danger" : "default"} />
        <StatCard title="Active Jobs" value={jobs.length} icon={Briefcase} variant="info"
          subtitle={`${jobs.filter(j => j.is_finished).length} completed`} />
        <StatCard title="Total Clients" value={clientCount} icon={Users} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold mb-4">Transport Modes</h3>
          <div className="h-64 flex items-center justify-center">
            {transportModes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={transportModes} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {transportModes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No job data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-sm font-semibold mb-4">Monthly Credits vs Debits</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTxns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="credits" name="Credits" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="debits" name="Debits" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: Recent Jobs + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="xl:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold">Recent Jobs</h3>
            <Link href="/jobs" className="text-xs text-indigo-600 font-medium hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Job #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Mode</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.slice(0, 10).map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs font-semibold text-indigo-600">#{job.id}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{job.job_date}</p>
                    </td>
                    <td className="px-6 py-3 font-medium">{job.client?.name || job.client_details?.name || "—"}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs">{job.port_loading} → {job.port_discharge}</span>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge variant={job.transport_mode === "SEA" ? "sea" : job.transport_mode === "AIR" ? "air" : "land"}>
                        {job.transport_mode}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-3 text-right relative">
                      <button onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === job.id ? null : job.id); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                      {activeMenu === job.id && (
                        <div className="absolute right-6 top-12 w-48 bg-white rounded-lg shadow-xl border z-50 py-1">
                          <Link href={`/jobs/${job.id}/view`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50">
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </Link>
                          <Link href={`/invoices/${job.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50">
                            <FileText className="w-3.5 h-3.5" /> Invoice
                          </Link>
                          <button onClick={() => handleDeleteJob(job.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No jobs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            {auditLogs.slice(0, 15).map(log => (
              <div key={log.id} className="relative pl-5 border-l-2 border-slate-100 py-1 group">
                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition" />
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-indigo-600 capitalize">{log.user_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{log.action}</p>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign dashboard with charts and KPI cards"
```

---

### Task 6: Create Jobs List Page + Redesign Job Forms

**Files:**
- Create: `frontend/app/jobs/page.tsx`
- Modify: `frontend/app/jobs/new/page.tsx`
- Modify: `frontend/app/jobs/[id]/view/page.tsx`
- Modify: `frontend/app/jobs/[id]/edit/page.tsx`

- [ ] **Step 1: Create Jobs List page**

Create `frontend/app/jobs/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "../config";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { Plus, Eye, FileText, Trash2 } from "lucide-react";

interface Job {
  id: number;
  job_date: string;
  client?: { name: string };
  client_details?: { name: string };
  transport_mode: string;
  port_loading: string;
  port_discharge: string;
  is_finished?: boolean;
  is_invoiced?: boolean;
}

export default function JobsList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    axios.get(`${API_URL}/api/jobs/`, { headers: { Authorization: `Token ${token}` } })
      .then(res => { setJobs(res.data); setLoading(false); })
      .catch((err: any) => {
        if (err.response?.status === 401) { localStorage.clear(); window.location.href = "/login"; }
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this job and its invoice?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/api/jobs/${id}/`, { headers: { Authorization: `Token ${token}` } });
      setJobs(jobs.filter(j => j.id !== id));
    } catch { alert("Delete failed"); }
  };

  if (loading) return <PageSkeleton />;

  const columns = [
    {
      key: "id", label: "Job #", sortable: true,
      render: (row: Job) => <span className="font-mono text-xs font-semibold text-indigo-600">#{row.id}</span>,
    },
    {
      key: "client_name", label: "Client", sortable: true,
      render: (row: Job) => <span className="font-medium">{row.client?.name || row.client_details?.name || "—"}</span>,
    },
    {
      key: "route", label: "Route",
      render: (row: Job) => <span className="text-xs">{row.port_loading} → {row.port_discharge}</span>,
    },
    {
      key: "transport_mode", label: "Mode", sortable: true,
      render: (row: Job) => (
        <StatusBadge variant={row.transport_mode === "SEA" ? "sea" : row.transport_mode === "AIR" ? "air" : "land"}>
          {row.transport_mode}
        </StatusBadge>
      ),
    },
    {
      key: "job_date", label: "Date", sortable: true,
      render: (row: Job) => <span className="text-xs text-muted-foreground">{row.job_date}</span>,
    },
    {
      key: "status", label: "Status",
      render: (row: Job) => (
        <StatusBadge variant={row.is_finished ? "completed" : row.is_invoiced ? "active" : "pending"}>
          {row.is_finished ? "Completed" : row.is_invoiced ? "Invoiced" : "Pending"}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" description={`${jobs.length} total jobs`}>
        <Link href="/jobs/new">
          <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Job
          </button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={jobs}
        searchable
        searchPlaceholder="Search jobs..."
        searchKeys={["id", "port_loading", "port_discharge"]}
        pageSize={12}
        onRowClick={row => router.push(`/jobs/${row.id}/view`)}
        actions={row => (
          <div className="flex items-center gap-1">
            <Link href={`/jobs/${row.id}/view`} className="p-1.5 rounded hover:bg-slate-100" title="View">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
            </Link>
            <Link href={`/invoices/${row.id}`} className="p-1.5 rounded hover:bg-slate-100" title="Invoice">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
            </Link>
            <button onClick={e => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded hover:bg-rose-50" title="Delete">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            </button>
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update New Job page header to remove per-page nav**

In `frontend/app/jobs/new/page.tsx`, replace the outer wrapper. Change:
- Remove `min-h-screen bg-slate-50 p-6 flex justify-center font-sans` wrapper — the AuthLayout handles padding
- Change cancel button to use router.back()

The key changes are:
1. Remove the outer `min-h-screen` wrapper div
2. Import and use `PageHeader`
3. Remove manual cancel button from header (PageHeader handles it)

Replace the return statement structure — keep all form logic and handlers identical, just wrap in new layout:

```tsx
// At top of file, add:
import { PageHeader } from "@/components/ui/page-header";

// Replace the return — remove outer wrapper, keep form identical
return (
  <div className="space-y-6 max-w-4xl">
    <PageHeader title="Create New Job" description="Enter shipment details to generate a job card.">
      <button onClick={() => router.push("/")} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50">Cancel</button>
    </PageHeader>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Keep ALL existing form sections (Customer Information, Shipment Details) EXACTLY as-is */}
      {/* The sectionClass, labelClass, inputClass variables stay the same */}
      {/* ... existing form JSX unchanged ... */}
    </form>
  </div>
);
```

- [ ] **Step 3: Update Job View page**

In `frontend/app/jobs/[id]/view/page.tsx`, wrap content with new layout:

```tsx
// Add import at top:
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

// Replace outer wrapper — remove min-h-screen, add PageHeader
// Keep ALL existing detail sections and handlers identical
```

The view page already has extensive detail layout — the main changes are:
1. Remove outer `min-h-screen bg-slate-100` wrapper
2. Add `PageHeader` with job info
3. Keep the dark header bar, detail grid, and all handlers
4. Update colors from `bg-blue-600` to `bg-indigo-600` for consistency

- [ ] **Step 4: Update Edit Job page similarly**

Same pattern as New Job — remove outer wrapper, add PageHeader import, keep form logic.

- [ ] **Step 5: Commit**

```bash
git add app/jobs/
git commit -m "feat: add jobs list page and redesign job forms"
```

---

### Task 7: Redesign Transactions Page

**Files:**
- Modify: `frontend/app/transactions/page.tsx`

- [ ] **Step 1: Rewrite transactions page**

Replace `frontend/app/transactions/page.tsx`. Key changes:
1. Remove outer min-h-screen wrapper and close button — AuthLayout handles nav
2. Add StatCard summary row at top (Total Credits, Total Debits, Net Balance, This Month)
3. Style tabs as color-coded pills (CR=emerald, CP=rose, BR=teal, BP=red)
4. Replace centered edit modal with slide-over panel
5. Import shared components
6. Add sparkline above transaction history

The full rewrite preserves ALL existing state management, API calls, form handlers, and business logic. Only the JSX return and styling change.

```tsx
// Top imports — add:
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { DollarSign, TrendingUp, TrendingDown, ArrowLeftRight, X } from "lucide-react";

// Keep ALL existing state, useEffect, handlers, client/job logic EXACTLY as-is

// Replace the return with:
// 1. PageHeader instead of manual h1
// 2. Summary cards row
// 3. Two-column layout with colored pill tabs
// 4. Slide-over panel instead of centered modal for edit
```

The key tab styling change:

```tsx
const tabColors = {
  CR: "bg-emerald-100 text-emerald-700 border-emerald-300",
  CP: "bg-rose-100 text-rose-700 border-rose-300",
  BR: "bg-teal-100 text-teal-700 border-teal-300",
  BP: "bg-red-100 text-red-700 border-red-300",
};
```

- [ ] **Step 2: Commit**

```bash
git add app/transactions/page.tsx
git commit -m "feat: redesign transactions page with summary cards and colored tabs"
```

---

### Task 8: Redesign Reports Page with Chart

**Files:**
- Modify: `frontend/app/reports/page.tsx`

- [ ] **Step 1: Add running balance chart**

Update `frontend/app/reports/page.tsx`. Key changes:
1. Remove outer min-h-screen wrapper
2. Use PageHeader and StatCard components
3. Add a running balance line chart between summary cards and table
4. Keep ALL existing filter logic, useMemo calculations, LedgerTable component

Add after the Summary cards grid:

```tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// In the JSX, between summary cards and table:
{reportData.length > 0 && (
  <div className="bg-white rounded-xl border shadow-sm p-6">
    <h3 className="text-sm font-semibold mb-4">Running Balance</h3>
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={reportData.map(r => ({ date: r.date, balance: r.currentBalance }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
          <Line type="monotone" dataKey="balance" stroke="#4F46E5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)}
```

Update Summary component to use StatCard pattern.
Update LedgerTable to match new DataTable styling.

- [ ] **Step 2: Commit**

```bash
git add app/reports/page.tsx
git commit -m "feat: redesign reports page with running balance chart"
```

---

### Task 9: Update Ledger Page (Screen-Only Improvements)

**Files:**
- Modify: `frontend/app/reports/ledger/page.tsx`

- [ ] **Step 1: Add sidebar-compatible wrapper**

In `frontend/app/reports/ledger/page.tsx`:
1. Remove the `← Back to Dashboard` button (sidebar handles nav)
2. Replace it with a PageHeader that auto-hides on print
3. Keep ALL print styles, letterhead, inline styles, and ledger table EXACTLY as-is
4. The filter form and statement view logic stays identical

The only visible changes:
- Filter form gets styled like the reports page filter bar
- Add a prominent "Print" button styled with indigo
- Wrap the entire page content so it works within the sidebar layout

```tsx
// Add imports:
import { PageHeader } from "@/components/ui/page-header";

// In the filter form section, replace the Back to Dashboard button with:
// (nothing — sidebar handles navigation)

// Add PageHeader before the filter form:
<PageHeader title="Client Ledger" description="Generate professional statement of accounts" />
```

Keep ALL existing print CSS, letterhead JSX, table structure, and inline styles completely unchanged.

- [ ] **Step 2: Commit**

```bash
git add app/reports/ledger/page.tsx
git commit -m "feat: update ledger page for sidebar layout, preserve print styles"
```

---

### Task 10: Update Invoice Pages

**Files:**
- Modify: `frontend/app/invoices/[jobId]/page.tsx`
- Keep: `frontend/app/invoices/[jobId]/view/page.tsx` (minimal changes — it's a print document)

- [ ] **Step 1: Update invoice editor**

In `frontend/app/invoices/[jobId]/page.tsx`:
1. Remove outer min-h-screen wrapper
2. Import PageHeader
3. Keep ALL existing form logic, row management, save handler, modal for custom charge types
4. Update button colors from `bg-black` to `bg-indigo-600`
5. The invoice view page (`view/page.tsx`) is excluded from sidebar via AuthLayout — keep it as-is

- [ ] **Step 2: Commit**

```bash
git add app/invoices/
git commit -m "feat: update invoice editor styling for sidebar layout"
```

---

### Task 11: Delete AI Scanner & Clean Up

**Files:**
- Delete: `frontend/app/tools/ai-scanner/page.tsx`
- Delete: `frontend/app/tools/` (entire directory)

- [ ] **Step 1: Delete AI Scanner files**

```bash
rm -rf /Users/anaswerajay/CODE/logistics_system/frontend/app/tools
```

- [ ] **Step 2: Remove AI Scanner link from dashboard**

The dashboard was already rewritten in Task 5 without the AI Scanner card, so no additional change needed. Verify:

```bash
grep -r "ai-scanner\|AI Scanner\|tools/" /Users/anaswerajay/CODE/logistics_system/frontend/app/ --include="*.tsx"
```

Expected: No results (or only this delete confirmation).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove AI scanner page and tools directory"
```

---

### Task 12: Final Build Verification

- [ ] **Step 1: Run production build**

```bash
cd /Users/anaswerajay/CODE/logistics_system/frontend && npx next build 2>&1 | tail -20
```

Expected: Build succeeds. All pages compile without errors.

- [ ] **Step 2: Fix any TypeScript or build errors**

Address any errors from the build output. Common issues:
- Missing imports (lucide-react icons)
- Type mismatches in DataTable generics
- Unused variables from removed code

- [ ] **Step 3: Start dev server and verify visually**

```bash
cd /Users/anaswerajay/CODE/logistics_system/frontend && npx next dev -p 3000
```

Open http://localhost:3000 and verify:
- Login page renders with gradient
- After login, sidebar appears with all nav items
- Dashboard shows KPI cards and charts
- Jobs list page loads with DataTable
- All pages accessible via sidebar navigation

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve build errors from UI redesign"
```
