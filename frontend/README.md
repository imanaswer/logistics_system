# LogisticsERP Frontend

Next.js 16 frontend with shadcn/ui components, Recharts data visualization, and Tailwind CSS.

## Quick Start

```bash
npm install
npm run dev       # Development server at http://localhost:3000
npm run build     # Production build
npm start         # Start production server
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with charts and KPI cards |
| `/login` | Authentication page |
| `/jobs` | Jobs list with search and sorting |
| `/jobs/new` | Create new job |
| `/jobs/[id]/view` | Job detail view |
| `/jobs/[id]/edit` | Edit job |
| `/invoices/[jobId]` | Invoice editor |
| `/invoices/[jobId]/view` | Print-ready invoice view |
| `/transactions` | Transaction management |
| `/reports` | Account statement with running balance |
| `/reports/ledger` | Professional ledger statement (print-optimized) |

## Shared Components

Located in `components/ui/`:

- **StatCard** — KPI card with icon, value, trend, and color variants
- **StatusBadge** — Color-coded pill badges (13 variants)
- **DataTable** — Generic sortable, searchable, paginated table
- **PageHeader** — Title + description + action slot
- **LoadingSkeleton** — Skeleton loaders for pages and tables
- **EmptyState** — Configurable empty state with icon and action
- **Sidebar** — Collapsible desktop sidebar + mobile drawer

## Design System

- **Primary**: Indigo-600
- **Success**: Emerald-500
- **Danger**: Rose-500
- **CSS Variables**: HSL format via shadcn/ui in `globals.css`
- **Utility**: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
