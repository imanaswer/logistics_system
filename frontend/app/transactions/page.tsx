"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_URL } from "../config";
import CreatableSelect from "react-select/creatable";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        
        console.log("🔗 API URL:", API_URL);
        console.log("🔑 Token exists:", !!token);

        // Fetch clients from jobs with detailed logging
        console.log("📞 Fetching clients from jobs...");
        const clientsRes = await axios.get(`${API_URL}/api/clients-from-jobs/`, config);
        console.log("✅ Clients response:", clientsRes.data);
        console.log(`📊 Found ${clientsRes.data.length} clients`);
        
        if (clientsRes.data.length === 0) {
          console.warn("⚠️ No clients found! Database might be empty or no clients have jobs.");
        }
        
        setClients(clientsRes.data);

        // Fetch jobs and history
        const [jobsRes, histRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/`, config),
          axios.get(`${API_URL}/api/transactions/`, config),
        ]);

        console.log(`📦 Loaded ${jobsRes.data.length} jobs and ${histRes.data.length} transactions`);
        setJobs(jobsRes.data);
        setHistory(histRes.data);
        
      } catch (err: any) {
        console.error("❌ API Error:", err);
        console.error("❌ Error message:", err.message);
        console.error("❌ Error response:", err.response?.data);
        console.error("❌ Error status:", err.response?.status);
        
        // Show user-friendly error messages
        if (err.response?.status === 401) {
          alert("⚠️ Session expired or invalid token. Please login again.");
          router.push("/login");
        } else if (err.response?.status === 403) {
          alert("⚠️ Access denied. Please check your permissions.");
        } else if (err.message.includes("Network Error") || err.code === "ERR_NETWORK") {
          alert(`⚠️ Cannot connect to backend at ${API_URL}.\n\nPlease check:\n1. Backend is running on Render\n2. CORS is properly configured\n3. Your internet connection`);
        } else {
          alert(`⚠️ Failed to load data: ${err.response?.data?.detail || err.message}`);
        }
      }
    };

    init();
  }, [router]);

  // When job is selected, lock the client to that job's client
  useEffect(() => {
    if (selectedJob && typeof selectedJob.value === 'number') {
      const job = jobs.find(j => j.id === selectedJob.value);
      if (job && job.client_details) {
        const lockedClient: SelectOption = {
          label: job.client_details.name,
          value: job.client_details.id
        };
        setSelectedClient(lockedClient);
      }
    }
  }, [selectedJob, jobs]);

  const handleSubmit = async () => {
    if (!amount || !selectedClient) {
      alert("Amount and Client are required");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      let clientId: number;

      // If it's a new client (string value), create it first
      if (typeof selectedClient.value === 'string') {
        const clientRes = await axios.post(
          `${API_URL}/api/clients/`,
          { 
            name: selectedClient.label, 
            address: "", 
            postal_code: "", 
            phone: "", 
            email: "", 
            vat_number: "" 
          },
          { headers: { Authorization: `Token ${token}` } }
        );
        clientId = clientRes.data.id;
        setClients((c) => [...c, clientRes.data]);
      } else {
        clientId = selectedClient.value as number;
      }

      const payload: any = {
        trans_type: activeTab,
        amount: Number(amount),
        date,
        description,
        client: clientId,
      };

      if (selectedJob && typeof selectedJob.value === 'number') {
        payload.job = selectedJob.value;
      }

      const res = await axios.post(
        `${API_URL}/api/transactions/`,
        payload,
        { headers: { Authorization: `Token ${token}` } }
      );

      setHistory((h) => [res.data, ...h]);
      setAmount("");
      setSelectedClient(null);
      setSelectedJob(null);
      setDescription("");
      alert("✅ Transaction recorded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete transaction?")) return;

    try {
      await axios.delete(`${API_URL}/api/transactions/${id}/`, {
        headers: { Authorization: `Token ${localStorage.getItem("token")}` },
      });

      setHistory((h) => h.filter((t) => t.id !== id));
      alert("✅ Transaction deleted");
    } catch {
      alert("Delete failed");
    }
  };

  const tabClass = (t: string) =>
    `flex-1 py-3 text-xs font-bold rounded-lg transition text-black ${
      activeTab === t
        ? "bg-white shadow border border-slate-200"
        : "bg-slate-50 hover:bg-white"
    }`;

  // Convert clients to react-select options
  const clientOptions: SelectOption[] = clients.map(c => ({
    label: c.name,
    value: c.id
  }));

  // Convert jobs to react-select options
  const jobOptions: SelectOption[] = jobs.map(j => ({
    label: `Job #${j.id} - ${j.client_details?.name || 'Unknown Client'}`,
    value: j.id
  }));

  // Check if client should be locked (when job is selected)
  const isClientLocked = selectedJob !== null;

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex justify-center text-black">
      <button
        onClick={() => router.push("/")}
        className="fixed top-6 right-6 bg-white p-3 rounded-full border shadow hover:bg-slate-50"
        data-testid="close-button"
      >
        ✕
      </button>

      <div className="w-full max-w-6xl flex gap-8">
        {/* LEFT */}
        <div className="w-full max-w-3xl space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-black">
                Record Transaction
              </h1>
              <p className="text-sm text-slate-700">
                Add a new financial entry with automated voucher numbering
              </p>
            </div>
            {selectedClient && typeof selectedClient.value === 'number' && (
              <button
                onClick={() => router.push(`/reports/ledger?clientId=${selectedClient.value}`)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                data-testid="view-ledger-button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                View Ledger
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white p-2 rounded-xl border flex gap-2">
            {["CR", "CP", "BR", "BP"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={tabClass(t)}
                data-testid={`tab-${t}`}
              >
                {t === "CR"
                  ? "Cash Receive"
                  : t === "CP"
                  ? "Cash Pay"
                  : t === "BR"
                  ? "Bank Receive"
                  : "Bank Pay"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-2xl border space-y-6 shadow-sm">
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  label: "Amount (OMR)",
                  value: amount,
                  onChange: setAmount,
                  type: "number",
                  testid: "amount-input"
                },
                {
                  label: "Date",
                  value: date,
                  onChange: setDate,
                  type: "date",
                  testid: "date-input"
                },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-xs font-bold text-black">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="w-full p-3 border rounded-lg font-bold text-black focus:outline-none focus:ring-2 focus:ring-slate-300"
                    data-testid={f.testid}
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="text-xs font-bold text-black">
                  Link Job (Optional)
                </label>
                <CreatableSelect
                  isClearable
                  value={selectedJob}
                  onChange={(option) => setSelectedJob(option)}
                  options={jobOptions}
                  placeholder="Select or search job..."
                  isDisabled={false}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      padding: '4px',
                      fontWeight: 'bold',
                      borderRadius: '0.5rem',
                    }),
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  When you select a job, the client will be auto-locked to that job's client
                </p>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-black">
                  {["CR", "BR"].includes(activeTab)
                    ? "Received From"
                    : "Paid To"} *
                </label>
                <CreatableSelect
                  isClearable
                  value={selectedClient}
                  onChange={(option) => !isClientLocked && setSelectedClient(option)}
                  options={clientOptions}
                  placeholder={isClientLocked ? "Locked to job's client" : "Select or create new client..."}
                  isDisabled={isClientLocked}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      padding: '4px',
                      fontWeight: 'bold',
                      borderRadius: '0.5rem',
                      backgroundColor: isClientLocked ? '#f8fafc' : 'white',
                    }),
                  }}
                />
                {isClientLocked && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                    🔒 Client is locked to the selected job to prevent accounting errors
                  </div>
                )}
                {clients.length === 0 && !isClientLocked && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                    ⚠️ No existing clients found. Type a new client name to create one.
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-black">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border rounded-lg font-bold text-black"
                  placeholder="Optional transaction notes..."
                  data-testid="description-input"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
              data-testid="submit-transaction-button"
            >
              {loading ? "Saving..." : "Confirm Transaction"}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full max-w-md space-y-4">
          <h3 className="font-bold text-black text-sm">
            Recent Transactions
          </h3>

          {history.length === 0 && (
            <div className="text-sm text-slate-600 italic p-4">
              No transactions yet
            </div>
          )}

          {history.slice(0, 10).map((t) => (
            <div
              key={t.id}
              className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center"
              data-testid={`transaction-${t.id}`}
            >
              <div>
                <p className="font-bold text-black text-sm">
                  {t.voucher_no && (
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded mr-2">
                      {t.voucher_no}
                    </span>
                  )}
                  {t.client_name || t.party_name || "No Client"}
                </p>
                <p className="text-xs text-slate-600">
                  {t.date} • {t.job ? `Job #${t.job}` : "General"}
                </p>
                {t.description && (
                  <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {t.client && (
                  <button
                    onClick={() => router.push(`/reports/ledger?clientId=${t.client}`)}
                    className="text-blue-500 hover:text-blue-700 text-xs font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition"
                    data-testid={`view-ledger-${t.id}`}
                    title="View Ledger"
                  >
                    <svg className="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </button>
                )}
                <span
                  className={`font-bold text-sm ${
                    ["CR", "BR"].includes(t.trans_type)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {["CR", "BR"].includes(t.trans_type) ? "+" : "-"}
                  {Number(t.amount).toFixed(3)}
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                  data-testid={`delete-transaction-${t.id}`}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
