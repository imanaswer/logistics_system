"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
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
}

interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  timestamp: string;
}

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#F43F5E"];

export default function Dashboard() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`${totalReceived.toLocaleString()} OMR`} icon={DollarSign} variant="success"
          subtitle={`${totalPaid.toLocaleString()} OMR paid out`} />
        <StatCard title="Outstanding" value={`${netBalance.toLocaleString()} OMR`} icon={AlertCircle}
          variant={netBalance < 0 ? "danger" : "default"} />
        <StatCard title="Active Jobs" value={jobs.length} icon={Briefcase} variant="info"
          subtitle={`${jobs.filter(j => j.is_finished).length} completed`} />
        <StatCard title="Total Clients" value={clientCount} icon={Users} />
      </div>

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
                    paddingAngle={4} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
