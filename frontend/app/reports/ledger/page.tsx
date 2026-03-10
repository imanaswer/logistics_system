"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
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
  total_debit: string;
  total_credit: string;
  net_balance: string;
  invoice_totals: {
    total_amount: string;
    total_vat: string;
    total_invoice: string;
  };
  final_balance: string;
  final_balance_type: "Dr" | "Cr";
}

// Format date as DD/MM/YYYY
function fmt(date: string) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Shared inline styles — keeps print rendering identical to screen
const th: React.CSSProperties = {
  border: "1px solid #888",
  padding: "4px 6px",
  fontWeight: "800",
  fontSize: "10px",
  textAlign: "center",
  background: "#d8d8d8",
};

const td: React.CSSProperties = {
  border: "1px solid #bbb",
  padding: "3px 6px",
  fontSize: "10px",
};

export default function LedgerStatementWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-400">
        Loading...
      </div>
    }>
      <LedgerStatement />
    </Suspense>
  );
}

function LedgerStatement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedClientId = searchParams.get("clientId");

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    preSelectedClientId ? Number(preSelectedClientId) : null
  );
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  // Capture print time once when report is generated
  const [printMeta, setPrintMeta] = useState({ date: "", time: "" });

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        const res = await axios.get(`${API_URL}/api/clients/`, config);
        setClients(res.data);

        if (preSelectedClientId) {
          const clientId = Number(preSelectedClientId);
          setSelectedClientId(clientId);
          setLoading(true);
          try {
            const r = await axios.get(`${API_URL}/api/reports/ledger/`, {
              headers: { Authorization: `Token ${token}` },
              params: {
                client_id: clientId,
                start_date: `${new Date().getFullYear()}-01-01`,
                end_date: new Date().toISOString().split("T")[0],
              },
            });
            setLedgerData(r.data);
            setShowPrintView(true);
            captureMeta();
          } catch (e) { console.error(e); }
          finally { setLoading(false); }
        }
      } catch { alert("Failed to load clients"); }
    };
    fetchClients();
  }, [router, preSelectedClientId]);

  const captureMeta = () => {
    const n = new Date();
    setPrintMeta({
      date: fmt(n.toISOString().split("T")[0]),
      time: n.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + (n.getHours() < 12 ? "AM" : "PM"),
    });
  };

  const fetchLedger = async () => {
    if (!selectedClientId) { alert("Please select a client"); return; }
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/api/reports/ledger/`, {
        headers: { Authorization: `Token ${token}` },
        params: {
          client_id: selectedClientId,
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
        },
      });
      setLedgerData(res.data);
      setShowPrintView(true);
      captureMeta();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to generate ledger statement");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      {!showPrintView ? (
        // ── Filter form ────────────────────────────────────────────────────
        <div className="max-w-4xl mx-auto">
          <button onClick={() => router.push("/")}
            className="mb-6 bg-white px-4 py-2 rounded-lg border shadow hover:bg-slate-50 text-sm font-semibold">
            ← Back to Dashboard
          </button>
          <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
            <div>
              <h1 className="text-2xl font-black text-black">Client Ledger Statement</h1>
              <p className="text-sm text-slate-500">Generate a professional Statement of Accounts</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black block mb-2">Select Client *</label>
                <select value={selectedClientId || ""} onChange={(e) => setSelectedClientId(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg font-bold text-black focus:outline-none focus:ring-2 focus:ring-slate-300"
                  data-testid="client-select">
                  <option value="">-- Select a Client --</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black block mb-2">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 border rounded-lg font-bold text-black" data-testid="start-date-input" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black block mb-2">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 border rounded-lg font-bold text-black" data-testid="end-date-input" />
                </div>
              </div>
            </div>
            <button onClick={fetchLedger} disabled={loading || !selectedClientId}
              className="w-full py-4 bg-black text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
              data-testid="generate-ledger-button">
              {loading ? "Generating..." : "Generate Statement of Accounts"}
            </button>
          </div>
        </div>

      ) : (
        // ── Statement view ─────────────────────────────────────────────────
        <div className="max-w-3xl mx-auto">

          {/* Screen-only buttons */}
          <div className="no-print mb-4 flex gap-3">
            <button onClick={() => setShowPrintView(false)}
              className="bg-white px-4 py-2 rounded-lg border shadow hover:bg-slate-50 text-sm font-semibold">
              ← Back to Filters
            </button>
            <button onClick={() => window.print()}
              className="bg-black text-white px-6 py-2 rounded-lg shadow hover:opacity-90 text-sm font-semibold"
              data-testid="print-button">
              🖨️ Print / Save as PDF
            </button>
          </div>

          {ledgerData && (
            <div id="print-area" style={{ background: "#fff", padding: "20px 24px", fontFamily: "Arial, sans-serif" }}>

              {/* ── Company letterhead ── */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "8px", marginBottom: "8px" }}>
                <div style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  SPEED INTERNATIONAL BUSINESS LLC
                </div>
                <div style={{ fontSize: "10px", marginTop: "2px" }}>P.O BOX:1432 , P.C: 114 , JIBROO</div>
                <div style={{ fontSize: "10px" }}>MUSCAT, SULTANATE OF OMAN</div>
                <div style={{ fontSize: "10px" }}>GSM: 96440813</div>
                <div style={{ fontSize: "10px" }}>E MAIL: speedinternationalshipping@gmail.com</div>
              </div>

              {/* ── Statement meta row ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase" }}>
                    STATEMENT OF ACCOUNTS
                  </div>
                  <div style={{ fontSize: "10px", marginTop: "2px" }}>
                    FOR THE PERIOD &nbsp;
                    <strong>{fmt(startDate)}</strong> &nbsp;To&nbsp; <strong>{fmt(endDate)}</strong>
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: "800", marginTop: "4px" }}>
                    ACCOUNT &nbsp;&nbsp; {ledgerData.client.name}
                  </div>
                  {ledgerData.client.address && (
                    <div style={{ fontSize: "9px", color: "#555", marginTop: "1px" }}>
                      {ledgerData.client.address}
                    </div>
                  )}
                  {ledgerData.client.vat_number && (
                    <div style={{ fontSize: "9px", color: "#555" }}>
                      VAT: {ledgerData.client.vat_number}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", fontSize: "10px", lineHeight: "1.6" }}>
                  <div>Date: &nbsp; {printMeta.date}</div>
                  <div>Time: &nbsp; {printMeta.time}</div>
                  <div>By: &nbsp;&nbsp;&nbsp; ADMIN</div>
                </div>
              </div>

              {/* ── Ledger table ── */}
              <table data-testid="ledger-table"
                style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: "9%" }}>Date</th>
                    <th style={{ ...th, width: "10%" }}>Voucher No</th>
                    <th style={{ ...th, textAlign: "left", width: "47%" }}>Particulars / Narration</th>
                    <th style={{ ...th, textAlign: "right", width: "11%" }}>Debit</th>
                    <th style={{ ...th, textAlign: "right", width: "11%" }}>Credit</th>
                    <th style={{ ...th, textAlign: "right", width: "12%" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr style={{ background: "#f5f5f5" }}>
                    <td style={td}></td>
                    <td style={td}></td>
                    <td style={{ ...td, fontWeight: "700" }}>Balance B/d</td>
                    <td style={{ ...td, textAlign: "right" }}></td>
                    <td style={{ ...td, textAlign: "right" }}></td>
                    <td style={{ ...td, textAlign: "right", fontWeight: "700" }}>0.000</td>
                  </tr>

                  {ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...td, textAlign: "center", color: "#888", fontStyle: "italic", padding: "14px" }}>
                        No transactions found for this period
                      </td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((entry, idx) => (
                      <tr key={entry.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                        <td style={td}>{fmt(entry.date)}</td>
                        <td style={{ ...td, fontFamily: "monospace", textAlign: "center" }}>
                          {entry.voucher_no || ""}
                        </td>
                        <td style={{ ...td, textAlign: "left" }}>{entry.particulars}</td>
                        <td style={{ ...td, textAlign: "right" }}>
                          {Number(entry.debit) > 0 ? Number(entry.debit).toFixed(3) : ""}
                        </td>
                        <td style={{ ...td, textAlign: "right" }}>
                          {Number(entry.credit) > 0 ? Number(entry.credit).toFixed(3) : ""}
                        </td>
                        <td style={{ ...td, textAlign: "right", fontWeight: "600" }}>
                          {Number(entry.running_balance).toFixed(3)}&nbsp;{entry.balance_type}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Totals */}
                  <tr style={{ background: "#e0e0e0", borderTop: "2px solid #555" }}>
                    <td colSpan={3} style={{ ...td, textAlign: "right", fontWeight: "900", fontSize: "10px" }}>
                      TOTALS
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: "800" }} data-testid="total-debit">
                      {Number(ledgerData.total_debit).toFixed(3)}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: "800" }} data-testid="total-credit">
                      {Number(ledgerData.total_credit).toFixed(3)}
                    </td>
                    <td style={td}></td>
                  </tr>

                  {/* Closing balance */}
                  <tr style={{ background: "#c8c8c8", borderTop: "1px solid #555" }}>
                    <td colSpan={5} style={{ ...td, textAlign: "right", fontWeight: "900", fontSize: "10px" }}>
                      CLOSING BALANCE
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: "900", fontSize: "11px" }} data-testid="final-balance">
                      {Number(ledgerData.final_balance).toFixed(3)}&nbsp;{ledgerData.final_balance_type}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ── Footer ── */}
              <div style={{
                marginTop: "20px", borderTop: "1px solid #ccc", paddingTop: "6px",
                textAlign: "center", fontSize: "9px", color: "#777"
              }}>
                <div>This is a computer-generated statement and does not require a signature.</div>
                <div>For any queries, please contact our accounts department.</div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Print styles — force A4, hide UI chrome */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #print-area { padding: 0 !important; }
          @page {
            size: A4 portrait;
            margin: 1cm 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
