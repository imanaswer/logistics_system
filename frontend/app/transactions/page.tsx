"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_URL } from "../config";
import CreatableSelect from "react-select/creatable";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { DollarSign, TrendingUp, TrendingDown, ArrowLeftRight, X } from "lucide-react";

interface Client {
  id: number;
  name: string;
  address?: string;
}

interface Job {
  id: number;
  client: number;
  client_details?: Client;
}

interface SelectOption {
  label: string;
  value: number | string;
}

const tabConfig = {
  CR: { label: "Cash Receive", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  CP: { label: "Cash Pay", color: "bg-rose-100 text-rose-700 border-rose-300" },
  BR: { label: "Bank Receive", color: "bg-teal-100 text-teal-700 border-teal-300" },
  BP: { label: "Bank Pay", color: "bg-red-100 text-red-700 border-red-300" },
};

export default function Transactions() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"CR" | "CP" | "BR" | "BP">("CR");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [selectedJob, setSelectedJob] = useState<SelectOption | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<SelectOption | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [historyFilter, setHistoryFilter] = useState<"ALL"|"CR"|"CP"|"BR"|"BP">("ALL");

  const [editingTxn, setEditingTxn] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<"CR"|"CP"|"BR"|"BP">("CR");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        const clientsRes = await axios.get(`${API_URL}/api/clients-from-jobs/`, config);
        setClients(clientsRes.data);

        const [jobsRes, histRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/`, config),
          axios.get(`${API_URL}/api/transactions/`, config),
        ]);

        setJobs(jobsRes.data);
        setHistory(histRes.data);
      } catch (err: any) {
        if (err.response?.status === 401) { router.push("/login"); }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (selectedJob && typeof selectedJob.value === 'number') {
      const job = jobs.find(j => j.id === selectedJob.value);
      if (job && job.client_details) {
        setSelectedClient({ label: job.client_details.name, value: job.client_details.id });
      }
    }
  }, [selectedJob, jobs]);

  const handleSubmit = async () => {
    if (!amount || !selectedClient) { alert("Amount and Client are required"); return; }
    const token = localStorage.getItem("token");

    try {
      let clientId: number;
      if (typeof selectedClient.value === 'string') {
        const clientRes = await axios.post(
          `${API_URL}/api/clients/`,
          { name: selectedClient.label, address: "", postal_code: "", phone: "", email: "", vat_number: "" },
          { headers: { Authorization: `Token ${token}` } }
        );
        clientId = clientRes.data.id;
        setClients(c => [...c, clientRes.data]);
      } else {
        clientId = selectedClient.value as number;
      }

      const payload: any = { trans_type: activeTab, amount: Number(amount), date, description, client: clientId };
      if (selectedJob && typeof selectedJob.value === 'number') payload.job = selectedJob.value;

      const res = await axios.post(`${API_URL}/api/transactions/`, payload, { headers: { Authorization: `Token ${token}` } });
      setHistory(h => [res.data, ...h]);
      setAmount("");
      setSelectedClient(null);
      setSelectedJob(null);
      setDescription("");
    } catch { alert("Failed to save transaction"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete transaction?")) return;
    try {
      await axios.delete(`${API_URL}/api/transactions/${id}/`, {
        headers: { Authorization: `Token ${localStorage.getItem("token")}` },
      });
      setHistory(h => h.filter(t => t.id !== id));
    } catch { alert("Delete failed"); }
  };

  const openEdit = (txn: any) => {
    setEditingTxn(txn);
    setEditAmount(String(txn.amount));
    setEditDate(txn.date);
    setEditDescription(txn.description || "");
    setEditType(txn.trans_type);
  };

  const handleEditSave = async () => {
    if (!editAmount || !editDate) { alert("Amount and date are required"); return; }
    setEditLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.patch(
        `${API_URL}/api/transactions/${editingTxn.id}/`,
        { amount: Number(editAmount), date: editDate, description: editDescription, trans_type: editType },
        { headers: { Authorization: `Token ${token}` } }
      );
      setHistory(h => h.map(t => (t.id === editingTxn.id ? res.data : t)));
      setEditingTxn(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update transaction");
    } finally { setEditLoading(false); }
  };

  const clientOptions: SelectOption[] = clients.map(c => ({ label: c.name, value: c.id }));
  const jobOptions: SelectOption[] = jobs.map(j => ({
    label: `Job #${j.id} - ${j.client_details?.name || 'Unknown Client'}`, value: j.id
  }));
  const isClientLocked = selectedJob !== null;

  const totalCredits = useMemo(() =>
    history.filter(t => ["CR", "BR"].includes(t.trans_type)).reduce((s, t) => s + Number(t.amount), 0), [history]);
  const totalDebits = useMemo(() =>
    history.filter(t => ["CP", "BP"].includes(t.trans_type)).reduce((s, t) => s + Number(t.amount), 0), [history]);

  if (loading) return <PageSkeleton />;

  const filtered = historyFilter === "ALL" ? history : history.filter(t => t.trans_type === historyFilter);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Record and manage financial entries">
        {selectedClient && typeof selectedClient.value === 'number' && (
          <button onClick={() => router.push(`/reports/ledger?clientId=${selectedClient.value}`)}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
            View Ledger
          </button>
        )}
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Credits" value={`${totalCredits.toFixed(3)} OMR`} icon={TrendingUp} variant="success" />
        <StatCard title="Total Debits" value={`${totalDebits.toFixed(3)} OMR`} icon={TrendingDown} variant="danger" />
        <StatCard title="Net Balance" value={`${(totalCredits - totalDebits).toFixed(3)} OMR`} icon={DollarSign} variant="info" />
        <StatCard title="This Month" value={history.filter(t => t.date?.startsWith(new Date().toISOString().substring(0, 7))).length} icon={ArrowLeftRight} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="bg-white p-1.5 rounded-xl border flex gap-1.5">
            {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition border ${
                  activeTab === t ? tabConfig[t].color : "bg-white text-slate-500 border-transparent hover:bg-slate-50"
                }`}>
                {tabConfig[t].label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white p-6 rounded-xl border space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Amount (OMR)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-700 mb-1 block">Link Job (Optional)</label>
                <CreatableSelect isClearable value={selectedJob} onChange={option => setSelectedJob(option)}
                  options={jobOptions} placeholder="Select or search job..."
                  styles={{ control: (base) => ({ ...base, padding: '4px', borderRadius: '0.5rem', fontSize: '14px' }) }} />
                <p className="text-xs text-muted-foreground mt-1">Selecting a job locks the client automatically</p>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  {["CR", "BR"].includes(activeTab) ? "Received From" : "Paid To"} *
                </label>
                <CreatableSelect isClearable value={selectedClient}
                  onChange={option => !isClientLocked && setSelectedClient(option)}
                  options={clientOptions}
                  placeholder={isClientLocked ? "Locked to job's client" : "Select or create new client..."}
                  isDisabled={isClientLocked}
                  styles={{ control: (base) => ({ ...base, padding: '4px', borderRadius: '0.5rem', fontSize: '14px', backgroundColor: isClientLocked ? '#f8fafc' : 'white' }) }} />
                {isClientLocked && (
                  <p className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded mt-2">Client locked to selected job</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-700 mb-1 block">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Optional transaction notes..." />
              </div>
            </div>

            <button onClick={handleSubmit}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm">
              Confirm Transaction
            </button>
          </div>
        </div>

        {/* RIGHT: History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold">Transaction History</h3>

          {/* Filter tabs */}
          <div className="bg-white rounded-xl border p-1 flex gap-1">
            {(["ALL","CR","CP","BR","BP"] as const).map(key => {
              const labels: Record<string,string> = { ALL:"All", CR:"CR", CP:"CP", BR:"BR", BP:"BP" };
              const cnt = key === "ALL" ? history.length : history.filter(t => t.trans_type === key).length;
              return (
                <button key={key} onClick={() => { setHistoryFilter(key); setCurrentPage(1); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex flex-col items-center gap-0.5 ${
                    historyFilter === key ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:bg-slate-100"
                  }`}>
                  <span>{labels[key]}</span>
                  <span className={`text-[10px] ${historyFilter === key ? "text-white/60" : "text-slate-400"}`}>{cnt}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground italic p-4 bg-white rounded-xl border">No transactions yet</div>
          )}
          {paginated.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">
                  {t.voucher_no && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded mr-2 font-mono">{t.voucher_no}</span>}
                  {t.client_name || t.party_name || "No Client"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.date} · {t.job ? `Job #${t.job}` : "General"}</p>
                {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {t.client && (
                  <button onClick={() => router.push(`/reports/ledger?clientId=${t.client}`)}
                    className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition" title="Ledger">
                    Ledger
                  </button>
                )}
                <span className={`font-semibold text-sm tabular-nums ${["CR","BR"].includes(t.trans_type) ? "text-emerald-600" : "text-rose-600"}`}>
                  {["CR","BR"].includes(t.trans_type) ? "+" : "-"}{Number(t.amount).toFixed(3)}
                </span>
                <button onClick={() => openEdit(t)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition" title="Edit">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition" title="Delete">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border text-sm">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-medium bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">
                Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                className="px-3 py-1 text-xs font-medium bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Slide-over */}
      {editingTxn && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingTxn(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl p-6 space-y-5 overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Edit Transaction</h2>
                <p className="text-xs text-muted-foreground">{editingTxn.voucher_no} · {editingTxn.client_name || editingTxn.party_name}</p>
              </div>
              <button onClick={() => setEditingTxn(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-2">Transaction Type</label>
              <div className="grid grid-cols-4 gap-2">
                {(["CR","CP","BR","BP"] as const).map(t => (
                  <button key={t} onClick={() => setEditType(t)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      editType === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Amount (OMR)</label>
                <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Date</label>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Description</label>
              <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)}
                placeholder="Optional notes..."
                className="w-full p-3 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingTxn(null)}
                className="flex-1 py-3 border rounded-lg text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleEditSave} disabled={editLoading}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
