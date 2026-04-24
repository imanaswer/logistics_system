# LogisticsERP

Full-stack logistics management system for **Speed International Business LLC** — handles job tracking, invoicing, transactions, client ledger statements, and financial reporting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 3 |
| UI Components | shadcn/ui (new-york style), Recharts 3 |
| Backend | Django REST Framework, Python |
| Database | Supabase PostgreSQL |
| Auth | Token-based (DRF TokenAuthentication) |

## Features

- **Dashboard** — KPI cards, revenue trend chart, transport mode breakdown, monthly credits vs debits, recent jobs & activity feed
- **Jobs** — Create, view, edit, delete shipping jobs with client linking, transport modes (Sea/Air/Land), and route tracking
- **Invoices** — Per-job invoice editor with line items, VAT calculation, and print-optimized PDF view
- **Transactions** — Record cash/bank receipts and payments, link to jobs/clients, slide-over edit panel
- **Reports** — Running balance statement with date/client filters, balance chart, and paginated table
- **Ledger** — Professional Statement of Accounts with print-ready letterhead layout (A4 optimized)
- **Sidebar Navigation** — Persistent collapsible sidebar with grouped menu items

## Project Structure

```
logistics_system/
├── backend/          # Django REST API
├── frontend/         # Next.js frontend
│   ├── app/          # Pages (dashboard, jobs, invoices, transactions, reports, login)
│   ├── components/   # Shared UI components (sidebar, stat-card, data-table, etc.)
│   └── lib/          # Utilities (cn helper)
└── docs/             # Design specs and implementation plans
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Set NEXT_PUBLIC_API_URL
npm run dev                   # http://localhost:3000
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver    # http://localhost:8000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g., `https://your-api.onrender.com`) |

## Deployment

- **Frontend**: Deploy to Vercel — connect the repo and set `NEXT_PUBLIC_API_URL` in environment variables
- **Backend**: Deploy to Render as a Python web service
- **Database**: Supabase PostgreSQL (managed)

## License

Private — Speed International Business LLC
