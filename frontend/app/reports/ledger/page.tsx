"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_URL } from "../../config";

interface Client {
  id: number;
  name: string;
  address?: string;
  vat_number?: string;
}

interface LedgerEntry {
  id: number;
  date: string;
  voucher_no: string;
  particulars: string;
  debit: string;
  credit: string;
  running_balance: string;
  balance_type: "Dr" | "Cr";
}

interface LedgerData {
  client: Client;
  entries: LedgerEntry[];
  final_balance: string;
  final_balance_type: "Dr" | "Cr";
}

export default function LedgerStatement() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        const clientsRes = await axios.get(`${API_URL}/api/clients/`, config);
        setClients(clientsRes.data);
      } catch (err) {
        console.error("Failed to fetch clients:", err);
        alert("Failed to load clients");
      }
    };

    fetchClients();
  }, [router]);

  const fetchLedger = async () => {
    if (!selectedClientId) {
      alert("Please select a client");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const config = { 
        headers: { Authorization: `Token ${token}` },
        params: {
          client_id: selectedClientId,
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate })
        }
      };

      const res = await axios.get(`${API_URL}/api/reports/ledger/`, config);
      setLedgerData(res.data);
      setShowPrintView(true);
    } catch (err: any) {
      console.error("Failed to fetch ledger:", err);
      alert(err.response?.data?.error || "Failed to generate ledger statement");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {!showPrintView ? (
        // Filter Form
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="mb-6 bg-white px-4 py-2 rounded-lg border shadow hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
            <div>
              <h1 className="text-2xl font-black text-black">
                Client Ledger Statement
              </h1>
              <p className="text-sm text-slate-700">
                Generate professional ledger statement with running balance
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black block mb-2">
                  Select Client *
                </label>
                <select
                  value={selectedClientId || ""}
                  onChange={(e) => setSelectedClientId(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg font-bold text-black focus:outline-none focus:ring-2 focus:ring-slate-300"
                  data-testid="client-select"
                >
                  <option value="">-- Select a Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black block mb-2">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 border rounded-lg font-bold text-black"
                    data-testid="start-date-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black block mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 border rounded-lg font-bold text-black"
                    data-testid="end-date-input"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={fetchLedger}
              disabled={loading || !selectedClientId}
              className="w-full py-4 bg-black text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
              data-testid="generate-ledger-button"
            >
              {loading ? "Generating..." : "Generate Ledger Statement"}
            </button>
          </div>
        </div>
      ) : (
        // Ledger Report View
        <div className="max-w-7xl mx-auto">
          <div className="no-print mb-6 flex gap-4">
            <button
              onClick={() => setShowPrintView(false)}
              className="bg-white px-4 py-2 rounded-lg border shadow hover:bg-slate-50"
            >
              ← Back to Filters
            </button>
            <button
              onClick={handlePrint}
              className="bg-black text-white px-6 py-2 rounded-lg shadow hover:opacity-90"
              data-testid="print-button"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>

          {ledgerData && (
            <div className="bg-white p-12 rounded-2xl border shadow-lg print:shadow-none print:border-0">
              {/* Header */}
              <div className="border-b-2 border-slate-300 pb-6 mb-6">
                <h1 className="text-3xl font-black text-center text-black">
                  LEDGER STATEMENT
                </h1>
                <p className="text-center text-sm text-slate-600 mt-2">
                  Professional Client Reconciliation Report
                </p>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">CLIENT NAME</p>
                  <p className="text-lg font-bold text-black">{ledgerData.client.name}</p>
                </div>
                {ledgerData.client.address && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">ADDRESS</p>
                    <p className="text-sm text-black">{ledgerData.client.address}</p>
                  </div>
                )}
                {ledgerData.client.vat_number && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">VAT NUMBER</p>
                    <p className="text-sm text-black">{ledgerData.client.vat_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 font-semibold">STATEMENT DATE</p>
                  <p className="text-sm text-black">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" data-testid="ledger-table">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-4 py-3 text-left text-xs font-bold text-black">
                        DATE
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-left text-xs font-bold text-black">
                        VOUCHER NO
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-left text-xs font-bold text-black">
                        PARTICULARS
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-right text-xs font-bold text-black">
                        DEBIT
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-right text-xs font-bold text-black">
                        CREDIT
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-right text-xs font-bold text-black">
                        BALANCE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-slate-300 px-4 py-8 text-center text-slate-500 italic">
                          No transactions found for this client
                        </td>
                      </tr>
                    ) : (
                      ledgerData.entries.map((entry, idx) => (
                        <tr 
                          key={entry.id} 
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="border border-slate-300 px-4 py-3 text-sm text-black">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-sm text-black font-mono">
                            {entry.voucher_no}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-sm text-black">
                            {entry.particulars}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-sm text-right text-black font-semibold">
                            {Number(entry.debit) > 0 ? Number(entry.debit).toFixed(3) : "-"}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-sm text-right text-black font-semibold">
                            {Number(entry.credit) > 0 ? Number(entry.credit).toFixed(3) : "-"}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-sm text-right text-black font-bold">
                            {entry.running_balance} {entry.balance_type}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200">
                      <td colSpan={5} className="border border-slate-300 px-4 py-4 text-right text-sm font-bold text-black">
                        FINAL BALANCE:
                      </td>
                      <td className="border border-slate-300 px-4 py-4 text-right text-lg font-black text-black">
                        {ledgerData.final_balance} {ledgerData.final_balance_type}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-slate-300">
                <p className="text-xs text-slate-500 text-center">
                  This is a computer-generated statement and does not require a signature.
                </p>
                <p className="text-xs text-slate-500 text-center mt-1">
                  For any queries, please contact our accounts department.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
}
