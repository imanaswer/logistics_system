"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_URL } from "../config";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const getDefaultFromDate = () => {
  const d = new Date();
  d.setMonth(0);
  d.setDate(1);
  return d.toISOString().split("T")[0];
};

const getToday = () => new Date().toISOString().split("T")[0];

export default function Reports() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [jobMap, setJobMap] = useState<{ [key: number]: string }>({});
  const [clients, setClients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [startDate, setStartDate] = useState(getDefaultFromDate());
  const [endDate, setEndDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) { window.location.href = "/login"; return; }

      try {
        const [jobsRes, transRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/`, { headers: { Authorization: `Token ${token}` } }),
          axios.get(`${API_URL}/api/transactions/`, { headers: { Authorization: `Token ${token}` } }),
        ]);

        const map: { [key: number]: string } = {};
        jobsRes.data.forEach((j: any) => {
          map[j.id] = j.client_details?.name || j.client?.name || "Unknown";
        });
        setJobMap(map);

        const txns = Array.isArray(transRes.data) ? transRes.data : transRes.data.results || [];
        const sortedData = txns.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setTransactions(sortedData);

        const rawNames = [
          ...sortedData.map((t: any) => t.display_party_name || t.party_name || (t.job ? map[t.job] : null) || "Unknown"),
          ...Object.values(map),
        ];
        const cleanNames = Array.from(new Set(rawNames.filter(n => n).map(n => n?.toUpperCase().trim()))).sort();
        setClients(cleanNames);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const reportData = useMemo(() => {
    let runningBalance = 0;

    let result = transactions.map(t => {
      const nameFromJob = t.job ? jobMap[t.job] : null;
      const resolvedName = (t.display_party_name || t.party_name || nameFromJob || "General Transaction").trim().toUpperCase();
      return { ...t, resolvedName };
    });

    if (selectedClient !== "ALL") {
      const term = selectedClient.toUpperCase();
      result = result.filter(t => t.resolvedName === term);
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) result = result.filter(t => new Date(t.date) >= start);
    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.date) <= endOfDay);
    }

    return result.map(t => {
      const amount = Math.abs(Number(t.amount || 0));
      const isCredit = ["CR", "BR"].includes(t.trans_type);
      const isPaidOut = ["CP", "BP"].includes(t.trans_type);
      const isDebit = t.trans_type === "INVOICE";
      const received = isCredit ? amount : 0;
      const paid = (isPaidOut || isDebit) ? amount : 0;
      runningBalance += (received - paid);
      return { ...t, received, paid, invoiceAmt: isDebit ? amount : 0, currentBalance: runningBalance };
    });
  }, [transactions, selectedClient, startDate, endDate, jobMap]);

  const totalReceived = reportData.reduce((sum, t) => sum + t.received, 0);
  const totalPaid = reportData.reduce((sum, t) => sum + t.paid, 0);
  const netBalance = totalReceived - totalPaid;

  const paginatedData = reportData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [selectedClient, startDate, endDate]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Account Statement" description="Running balance and cash flow analysis.">
        <button onClick={() => router.push("/reports/ledger")}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Professional Ledger
        </button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-5 bg-white border rounded-xl shadow-sm">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">Party Name</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="ALL">All Clients / Parties</option>
            {clients.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Received" value={totalReceived.toFixed(3)} icon={TrendingUp} variant="success" />
        <StatCard title="Total Paid" value={totalPaid.toFixed(3)} icon={TrendingDown} variant="danger" />
        <StatCard title="Net Cash Position" value={netBalance.toFixed(3)} icon={DollarSign} variant="info" />
      </div>

      {/* Running Balance Chart */}
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

      {/* Statement Table */}
      <div className="overflow-hidden bg-white border rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-medium uppercase text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Party & Job</th>
              <th className="p-4 text-left">Description</th>
              <th className="p-4 text-right">Received</th>
              <th className="p-4 text-right">Paid</th>
              <th className="p-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No transactions match your filters.</td></tr>
            ) : (
              paginatedData.map((t: any) => (
                <tr key={t.id} className="border-t hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-xs">{t.date}</td>
                  <td className="p-4">
                    <div className="font-medium text-sm">{t.resolvedName}</div>
                    {t.job && <span className="text-xs text-indigo-600 font-medium">JOB #{t.job}</span>}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">{t.description || "-"}</td>
                  <td className="p-4 text-right text-emerald-600 font-medium tabular-nums">{t.received ? t.received.toFixed(3) : "-"}</td>
                  <td className="p-4 text-right text-rose-600 font-medium tabular-nums">{t.paid ? t.paid.toFixed(3) : "-"}</td>
                  <td className="p-4 text-right font-semibold tabular-nums">{t.currentBalance.toFixed(3)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition">
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({reportData.length} total)
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-medium bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
