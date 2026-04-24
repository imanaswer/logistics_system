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
