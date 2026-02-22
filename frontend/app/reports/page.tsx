"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_URL } from "../config";

export default function Reports() {
  const router = useRouter();

  // --- HELPERS ---
  const getDefaultFromDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().split("T")[0];
  };
  const getToday = () => new Date().toISOString().split("T")[0];

  // --- STATE ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [jobMap, setJobMap] = useState<{ [key: number]: string }>({});
  const [clients, setClients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [startDate, setStartDate] = useState(getDefaultFromDate());
  const [endDate, setEndDate] = useState(getToday());
  const [loading, setLoading] = useState(true);

  // --- DATA LOADING ---
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const [jobsRes, transRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/`, {
            headers: { Authorization: `Token ${token}` },
          }),
          axios.get(`${API_URL}/api/transactions/`, {
            headers: { Authorization: `Token ${token}` },
          }),
        ]);

        // job → client name map
        const map: { [key: number]: string } = {};
        jobsRes.data.forEach((j: any) => {
          map[j.id] =
            j.client_details?.name || j.client?.name || "Unknown";
        });
        setJobMap(map);

        // sort by date ASC (ledger-safe)
        const txns = Array.isArray(transRes.data)
        ? transRes.data
        : transRes.data.results || [];

        const sortedData = txns.sort(
        (a: any, b: any) =>
            new Date(a.date).getTime() -
            new Date(b.date).getTime()
        );

        setTransactions(sortedData);


        // build party dropdown - FIX: Use display_party_name or resolve names properly
        const rawNames = [
          ...sortedData.map((t: any) => {
            // Priority: display_party_name > party_name > job client > "Unknown"
            return t.display_party_name || t.party_name || (t.job ? map[t.job] : null) || "Unknown";
          }),
          ...Object.values(map),
        ];
        const cleanNames = Array.from(
          new Set(rawNames.filter(n => n).map(n => n?.toUpperCase().trim()))
        ).sort();
        
        console.log("🔍 DEBUG: Building dropdown from", sortedData.length, "transactions");
        console.log("🔍 DEBUG: Raw names:", rawNames.slice(0, 10));
        console.log("🔍 DEBUG: Clean names for dropdown:", cleanNames);
        
        setClients(cleanNames);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

// --- FILTER + LEDGER LOGIC ---
  const reportData = useMemo(() => {
    let runningBalance = 0;
    
    console.log("🔍 DEBUG: reportData calculation started with", transactions.length, "transactions");
    
    // 1. Normalize name resolution so filtering actually works
    let result = transactions.map(t => {
      const nameFromJob = t.job ? jobMap[t.job] : null;
      const resolvedName = (
        t.display_party_name || 
        t.party_name || 
        nameFromJob || 
        "General Transaction"
      ).trim().toUpperCase();

      console.log(`🔍 Transaction #${t.id}: display_party_name="${t.display_party_name}", party_name="${t.party_name}", job=${t.job}, nameFromJob="${nameFromJob}", resolvedName="${resolvedName}", trans_type="${t.trans_type}"`);

      return { ...t, resolvedName };
    });

    // 1.5 EXCLUDE INVOICE TYPE - These are shadow entries handled separately in the professional ledger
    // Regular cash flow reports should only show actual cash movements (CR, BR, CP, BP)
    result = result.filter(t => t.trans_type !== 'INVOICE');
    console.log(`🔍 DEBUG: After excluding INVOICE transactions:`, result.length, "transactions");

      return { ...t, resolvedName };
    });

    // 2. APPLY CLIENT FILTER
    if (selectedClient !== "ALL") {
      const term = selectedClient.toUpperCase();
      console.log(`🔍 DEBUG: Filtering by client: "${term}"`);
      console.log(`🔍 DEBUG: Before filter:`, result.length, "transactions");
      result = result.filter(t => {
        const matches = t.resolvedName === term;
        console.log(`🔍   Transaction #${t.id}: resolvedName="${t.resolvedName}" ${matches ? "✅ MATCHES" : "❌ NO MATCH"}`);
        return matches;
      });
      console.log(`🔍 DEBUG: After filter:`, result.length, "transactions");
    }

    // 3. APPLY DATE FILTER
    // Convert strings to date objects for accurate comparison
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start) {
        result = result.filter(t => new Date(t.date) >= start);
    }
    if (end) {
        // Set end of day for the "To" date
        end.setHours(23, 59, 59, 999);
        result = result.filter(t => new Date(t.date) <= end);
    }

    // 4. LEDGER CALCULATION (Accounting Logic)
    return result.map(t => {
      const amount = Math.abs(Number(t.amount || 0));
      
      // CREDIT: Money received (CR = Cash Receive, BR = Bank Receive)
      const isCredit = ["CR", "BR"].includes(t.trans_type);
      
      // PAID OUT: Money you paid out (CP = Cash Pay, BP = Bank Pay)
      const isPaidOut = ["CP", "BP"].includes(t.trans_type);
      
      // DEBIT: Invoices (money owed to you)
      const isDebit = t.trans_type === "INVOICE";

      const received = isCredit ? amount : 0;
      const paid = isPaidOut ? amount : 0;

      // THE FIX: Add received, subtract paid
      runningBalance += (received - paid);

      return {
        ...t,
        received,
        paid,
        invoiceAmt: isDebit ? amount : 0,
        currentBalance: runningBalance,
      };
    });
  }, [transactions, selectedClient, startDate, endDate, jobMap]);

  const totalReceived = reportData.reduce(
    (sum, t) => sum + t.received,
    0
  );
  const totalPaid = reportData.reduce(
    (sum, t) => sum + t.paid,
    0
  );
  const netBalance = totalReceived - totalPaid;

  if (loading)
    return (
      <div className="p-10 font-black text-center text-slate-400">
        LOADING REPORTS...
      </div>
    );

  return (
    <div className="min-h-screen p-8 bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex items-center justify-between max-w-6xl mx-auto mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Ledger Statement
          </h1>
          <p className="font-medium text-slate-500">
            Real-time running balance and cash flow.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/reports/ledger")}
            className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
          >
            📊 Professional Ledger
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-xs font-bold bg-white border rounded-lg"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* FILTER BAR */}
        <div className="flex flex-col gap-4 p-5 bg-white border rounded-2xl shadow-sm md:flex-row">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Party Name
            </label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg font-bold bg-slate-50"
            >
              <option value="ALL">All Clients / Parties</option>
              {clients.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-40">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg font-bold"
            />
          </div>

          <div className="w-full md:w-40">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg font-bold"
            />
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Summary label="Total Received" value={totalReceived} color="green" />
          <Summary label="Total Paid" value={totalPaid} color="red" />
          <Summary label="Net Cash Position" value={netBalance} dark />
        </div>

        {/* TABLE */}
        <LedgerTable rows={reportData} />
      </div>
    </div>
  );
}

/* ---------------- SUB COMPONENTS ---------------- */

function Summary({
  label,
  value,
  color,
  dark,
}: any) {
  return (
    <div
      className={`p-6 rounded-2xl shadow-sm font-black ${
        dark ? "bg-slate-900 text-white" : "bg-white border"
      }`}
    >
      <p className="text-[10px] uppercase text-slate-400">{label}</p>
      <p
        className={`text-3xl ${
          color === "green"
            ? "text-emerald-600"
            : color === "red"
            ? "text-red-600"
            : ""
        }`}
      >
        {value.toFixed(3)}
      </p>
    </div>
  );
}

function LedgerTable({ rows }: any) {
  return (
    <div className="overflow-hidden bg-white border rounded-2xl shadow-sm">
      <table className="w-full">
        <thead className="bg-slate-50 text-xs font-black uppercase">
          <tr>
            <th className="p-4">Date</th>
            <th className="p-4">Party & Job</th>
            <th className="p-4">Description</th>
            <th className="p-4 text-right">Received</th>
            <th className="p-4 text-right text-red-500">Paid</th>
            <th className="p-4 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="p-10 text-center text-slate-400"
              >
                No transactions match your filters.
              </td>
            </tr>
          ) : (
            rows.map((t: any) => (
              <tr key={t.id} className="border-t">
                <td className="p-4 font-bold">{t.date}</td>
                <td className="p-4">
                <div className="font-bold">{t.resolvedName}</div> {/* NEW UPDATED LINE */}
                {t.job && (
                    <span className="text-xs text-blue-600 font-bold">
                    JOB #{t.job}
                    </span>
                )}
                </td>
                <td className="p-4 text-slate-500">
                  {t.description || "-"}
                </td>
                <td className="p-4 text-right text-green-600 font-bold">
                  {t.received ? t.received.toFixed(3) : "-"}
                </td>
                <td className="p-4 text-right text-red-600 font-bold">
                  {t.paid ? t.paid.toFixed(3) : "-"}
                </td>
                <td className="p-4 text-right font-black">
                  {t.currentBalance.toFixed(3)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
