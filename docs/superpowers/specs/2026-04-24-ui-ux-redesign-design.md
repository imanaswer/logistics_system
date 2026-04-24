# LogisticsERP Frontend UI/UX Redesign

## Overview

Complete UI/UX overhaul of the LogisticsERP Next.js frontend. Replace inconsistent per-page styling with a unified design system using shadcn/ui + Tailwind CSS + recharts. Add persistent sidebar navigation, rich data visualizations, and professional enterprise styling across all pages.

## Tech Stack

- **UI Components:** shadcn/ui (copy-paste, no heavy dependency)
- **Styling:** Tailwind CSS (existing)
- **Charts:** recharts (existing, expand usage)
- **Dropdowns:** react-select/creatable (existing, keep)
- **Icons:** lucide-react (comes with shadcn/ui)

## Design System

### Color Palette

| Token | Color | Hex | Usage |
|-------|-------|-----|-------|
| Primary | Indigo-600 | #4F46E5 | Buttons, active states, links |
| Secondary | Slate-700 | #334155 | Sidebar background |
| Success | Emerald-500 | #10B981 | Credits, positive indicators |
| Danger | Rose-500 | #F43F5E | Debits, errors, negative indicators |
| Warning | Amber-500 | #F59E0B | Pending states |
| Background | Slate-50 | #F8FAFC | Page backgrounds |
| Card | White | #FFFFFF | Card surfaces with shadow-sm |

### Typography

- Font: Inter (headings semibold, body regular)
- Monospace numbers in financial tables (font-variant-numeric: tabular-nums)

### Shared Components

- **Sidebar:** Fixed left, 256px wide, collapsible to 64px icon-only. Company logo at top, nav sections with sub-items, user avatar + logout at bottom. Mobile: slide-out drawer with overlay. Auto-hides on print via @media print.
- **PageHeader:** Title + breadcrumbs + action buttons
- **StatCard:** KPI card with icon, value, label, trend indicator (up/down %)
- **DataTable:** Sortable columns, search bar, pagination, row actions
- **StatusBadge:** Color-coded pills (Pending/Active/Completed/Cancelled)
- **LoadingSkeleton:** Animated placeholder blocks during data fetch
- **EmptyState:** Illustration + message when no data

### Navigation Structure

- Dashboard
- Jobs (All Jobs, New Job)
- Invoices
- Transactions
- Reports (Ledger, Statements)

## Page Designs

### Login Page

- Left panel (60%): Gradient background (indigo-600 to slate-800), company logo centered, "SPEED INTERNATIONAL BUSINESS LLC" heading, tagline, subtle CSS-only geometric shapes
- Right panel (40%): White card centered vertically, "Welcome back" heading, username + password fields with icons, full-width indigo Sign In button, loading spinner during auth, dismissible red error alert
- Mobile: full-screen white card, gradient becomes top banner with logo
- No changes to auth logic (token-based)

### Dashboard

**KPI Cards (4):**
- Total Revenue — sum of invoice amounts, trend vs last month
- Outstanding Balance — total unpaid, red when high
- Active Jobs — count with completed % ring
- Total Clients — count with new this month indicator

**Charts Row 1:**
- Revenue Trend (Line/Area) — 12-month revenue with gradient fill
- Job Status Breakdown (Donut) — Pending/In Progress/Completed/Cancelled with center total

**Charts Row 2:**
- Transport Mode Distribution (Pie) — Sea/Air/Land proportions
- Monthly Transactions (Stacked Bar) — Credits vs Debits, last 6 months

**Bottom Section:**
- Left: Recent Jobs table (last 10, compact)
- Right: Recent Activity feed (last 15 audit log entries)

**Filters:** Date range picker (This Month/Last Month/This Quarter/Custom) affecting all charts and KPIs

### Jobs List Page (new)

- DataTable: Job#, Client, Origin to Destination, Transport Mode, Status badge, Date, Actions
- Search across job number, client, route
- Filter chips: Status, Transport Mode
- "New Job" button in PageHeader

### New Job Page

- Two-column form (desktop), single column (mobile)
- Left: Client search (react-select/creatable), Job number (auto-gen with override), Date picker, Transport mode (visual icon cards for Sea/Air/Land)
- Right: Origin/Destination with swap button, Truck type, Weight/Quantity, Description
- Container section: expandable, "Add Container" button, removable cards per container
- Sticky bottom bar: Cancel + Save Draft + Create Job
- Inline validation (red border + error text)

### Job Detail Page

- Header: Job# + Status badge + client, actions (Edit, Create Invoice, WhatsApp, Email, Print)
- Route visualization: horizontal stepper Origin to Destination with transport icon
- Info grid: 2x3 cards (Transport Mode, Truck Type, Weight, Containers, Created, Updated)
- Tabs: Containers, Linked Invoices, Activity

### Invoices List Page (new)

- DataTable: Invoice#, Job#, Client, Date, Amount, VAT, Total, Status badge
- Filters: Status (Paid/Partial/Unpaid), Date range, Client
- Summary cards: Total Invoiced, Total Paid, Total Outstanding

### Invoice Editor Page

- Header: Job info bar (Job#, Client, Route)
- Line Items Table: drag-reorderable rows, columns (Charge Type dropdown, Description, Qty, Rate, Amount auto-calc), inline editing, add/delete rows
- Summary Panel (right sidebar desktop, bottom mobile): Subtotal, VAT toggle (5% default), VAT amount, Grand Total (large bold), Payment status badge
- Sticky action bar: Save Draft, Finalize, Print/PDF, Send Email
- Toggle preview mode with company letterhead

### Transactions Page

**Summary Cards (4):** Total Credits (green), Total Debits (red), Net Balance (blue), This Month count

**Left Panel — Form:**
- Pill-shaped tab toggles: CR (green), CP (red), BR (emerald), BP (rose)
- Fields: Party (react-select), Amount, Date, Description, Reference#
- Submit button matches active tab color
- Form stays open after submit with party pre-filled for batch entry

**Right Panel — History:**
- DataTable: Date, Type badge, Party, Description, Amount (color-coded), Reference
- Search + filters: Type toggle, Party, Date range
- Click row to expand/edit
- Edit via slide-over panel (replaces centered modal)
- Sparkline chart above table showing 30-day transaction volume

### Reports Page (Account Statement)

- Filter bar: Client selector + Date range + Generate, all inline
- Summary cards (3): Total Debits (red), Total Credits (green), Closing Balance (blue)
- Running balance line chart over selected period
- Statement DataTable: Date, Description, Type badge, Debit, Credit, Running Balance (with mini trend arrow)
- Totals row pinned at bottom
- Export: Print, PDF, CSV

### Ledger Page

- Preserve existing print layout and inline styles completely
- Screen-only improvements: add filter bar (client + date range), wrap in shared layout with sidebar, add Print button
- Sidebar auto-hides on print via @media print
- No changes to print CSS

## Deletions

- `frontend/app/tools/ai-scanner/page.tsx` — remove entirely
- Remove AI Scanner / Tools from navigation

## Constraints

- No changes to backend API — frontend-only redesign
- No changes to auth logic (token-based localStorage)
- Preserve print-optimized ledger styles
- Keep react-select/creatable for searchable dropdowns
- Keep existing API_URL config pattern
