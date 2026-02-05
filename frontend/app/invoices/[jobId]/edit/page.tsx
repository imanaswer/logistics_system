"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
// Make sure this path matches your project structure
import { API_URL } from "../../../config";

/* ================= TYPES & CONSTANTS ================= */

interface ChargeType {
  id: number;
  name: string;
}
interface InvoiceRow {
  charge_type: string;
  description: string;
  amount: number | "";
  vat: number;
  total: number;
}
interface Job {
  transport_document_no?: string;
  invoice_no?: string;
  vat_number?: string;
  client?: { name: string; vat_number?: string };
  client_details?: { name: string; vat_number?: string };
}

const API_BASE = `${API_URL}/api`;
const EMPTY_ROW: InvoiceRow = { charge_type: "", description: "", amount: "", vat: 0, total: 0 };

/* ================= ICONS ================= */

const IconPlus = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>;
const IconTrash = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IconBack = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>;

/* ================= MAIN COMPONENT ================= */

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId;

  // --- EXISTING STATE ---
  const [job, setJob] = useState<Job | null>(null);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [rows, setRows] = useState<InvoiceRow[]>([EMPTY_ROW]);
  const [billNo, setBillNo] = useState("");
  const [vatNo, setVatNo] = useState("");
  const [originalItemIds, setOriginalItemIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- NEW STATE: CUSTOM HEADER POPUP ---
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [targetRowIndex, setTargetRowIndex] = useState<number | null>(null);

  const authConfig = useMemo(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { headers: { Authorization: `Token ${token}` } } : null;
  }, []);

  // --- EXISTING LOAD LOGIC ---
  useEffect(() => {
    if (!authConfig) { router.push("/login"); return; }
    if (!jobId) return;

    const load = async () => {
      try {
        const [jobRes, chargeRes, itemRes] = await Promise.all([
          axios.get(`${API_BASE}/jobs/${jobId}/`, authConfig),
          axios.get(`${API_BASE}/chargetypes/`, authConfig),
          axios.get(`${API_BASE}/invoice-items/?job=${jobId}`, authConfig),
        ]);

        setJob(jobRes.data);
        setBillNo(jobRes.data.transport_document_no ?? "");
        setVatNo(jobRes.data.vat_number ?? "");
        setChargeTypes(chargeRes.data);

        const jobItems = itemRes.data;
        if (jobItems && jobItems.length > 0) {
          setRows(jobItems.map((i: any) => ({
            charge_type: String(i.charge_type),
            description: i.description || "",
            amount: Number(i.amount),
            vat: Number(i.vat),
            total: Number(i.total),
          })));
          setOriginalItemIds(jobItems.map((i: any) => i.id));
        } else {
          setRows([EMPTY_ROW]);
          setOriginalItemIds([]);
        }
      } catch (err) {
        console.error("Load error:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authConfig, jobId, router]);

  // --- NEW FUNCTION: SAVE NEW HEADER ---
  const handleCreateChargeType = async () => {
    if (!newTypeName.trim() || !authConfig) return;
    try {
      // 1. Save to backend
      const res = await axios.post(`${API_BASE}/chargetypes/`, { name: newTypeName }, authConfig);
      const newType = res.data;
      
      // 2. Add to dropdown list immediately
      setChargeTypes((prev) => [...prev, newType]);

      // 3. Auto-select it for the row that requested it
      if (targetRowIndex !== null) {
        updateRow(targetRowIndex, "charge_type", String(newType.id));
      }
      
      // 4. Close popup
      setIsAddingType(false);
      setNewTypeName("");
      setTargetRowIndex(null);
    } catch (err) {
      alert("Failed to add header. It might already exist.");
    }
  };

  // --- EXISTING UPDATE ROW LOGIC (VAT Calc Preserved) ---
  const updateRow = (index: number, field: keyof InvoiceRow, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      const numAmount = row.amount === "" ? 0 : Number(row.amount);

      // Auto-Calculate VAT if Charge Type or Amount changes
      if (field === "amount" || field === "charge_type") {
        // Use current state OR newly added type if available
        const charge = chargeTypes.find((c) => String(c.id) === row.charge_type);
        
        // Regex to check for taxable keywords
        const isTaxable = charge?.name?.toLowerCase().match(/custom|transport|handling|agency|fee|clearance/);
        row.vat = isTaxable ? numAmount * 0.05 : 0;
      }

      row.total = numAmount + row.vat;
      next[index] = row;
      return next;
    });
  };

  // --- EXISTING SAVE LOGIC (Safe Delete Preserved) ---
  const saveInvoice = async () => {
    if (!authConfig || !jobId) return;
    setIsSaving(true);
    try {
      // 1. Update Job Details
      await axios.patch(`${API_BASE}/jobs/${jobId}/`, { transport_document_no: billNo, vat_number: vatNo }, authConfig);
      
      // 2. Safe Delete (Only items belonging to THIS job)
      const currentItemsRes = await axios.get(`${API_BASE}/invoice-items/?job=${jobId}`, authConfig);
      const currentIds = currentItemsRes.data.map((x: any) => x.id);
      if (currentIds.length > 0) {
        await Promise.all(currentIds.map((id: number) => axios.delete(`${API_BASE}/invoice-items/${id}/`, authConfig)));
      }

      // 3. Create New Items
      const validRows = rows.filter((r) => r.charge_type && Number(r.amount) > 0);
      await Promise.all(validRows.map((r) =>
          axios.post(`${API_BASE}/invoice-items/`, {
            job: Number(jobId),
            charge_type: Number(r.charge_type),
            description: r.description || "Charge",
            amount: r.amount,
            vat: r.vat,
            total: r.total,
          }, authConfig)
        )
      );
      router.push(`/invoices/${jobId}/view`);
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed. Please check your data.");
    } finally {
      setIsSaving(false);
    }
  };

  const totals = useMemo(() => {
    return rows.reduce((acc, r) => ({
        subtotal: acc.subtotal + (Number(r.amount) || 0),
        vat: acc.vat + (Number(r.vat) || 0),
        grand: acc.grand + (Number(r.total) || 0),
      }), { subtotal: 0, vat: 0, grand: 0 }
    );
  }, [rows]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400">LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"><IconBack /></button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase">Billing Editor</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Job ID: #{jobId} | Ref: {job?.invoice_no || "Draft"}</p>
            </div>
          </div>
          <button onClick={saveInvoice} disabled={isSaving} className="bg-black hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl flex items-center gap-3">
            {isSaving ? "Syncing..." : <><IconCheck /> Finalize & Save</>}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Service Statement</h2>
              <button onClick={() => setRows([...rows, { ...EMPTY_ROW }])} className="text-blue-600 hover:text-black transition flex items-center gap-1 text-xs font-black uppercase"><IconPlus /> Add Row</button>
            </div>

            <div className="p-6 md:p-8 space-y-4">
              {rows.map((row, i) => (
                <div key={i} className="group grid grid-cols-12 gap-4 items-end p-5 rounded-2xl bg-slate-50/50 border-2 border-transparent hover:border-blue-100 hover:bg-white transition-all">
                  <div className="col-span-12 md:col-span-4 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Category</label>
                    {/* UPDATED SELECT DROPDOWN */}
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl text-sm font-bold h-12 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                      value={row.charge_type}
                      onChange={(e) => {
                        // DETECT "ADD_NEW" SELECTION
                        if (e.target.value === "ADD_NEW") {
                          setTargetRowIndex(i);
                          setIsAddingType(true);
                        } else {
                          updateRow(i, "charge_type", e.target.value);
                        }
                      }}
                    >
                      <option value="">Select Type</option>
                      {chargeTypes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {/* NEW OPTION AT THE BOTTOM */}
                      <option value="ADD_NEW" className="font-black text-blue-600 bg-blue-50">+ Add Custom Header...</option>
                    </select>
                    {/* DROPDOWN ARROW FIX */}
                    <div className="absolute right-4 top-[2.4rem] pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-5">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Description</label>
                    <input className="w-full bg-white border border-slate-200 rounded-xl text-sm font-bold h-12 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={row.description} onChange={(e) => updateRow(i, "description", e.target.value)} placeholder="Details..." />
                  </div>

                  <div className="col-span-10 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block text-right">Amount (OMR)</label>
                    <input type="number" step="0.001" className="w-full bg-white border border-slate-200 rounded-xl text-sm font-black h-12 px-4 text-right focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={row.amount} onChange={(e) => updateRow(i, "amount", e.target.value)} />
                  </div>

                  <div className="col-span-2 md:col-span-1 flex justify-center pb-2">
                    <button onClick={() => rows.length > 1 && setRows(rows.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 transition-all p-2"><IconTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xs font-black text-blue-200 uppercase tracking-[0.2em] mb-4">Customer Details</h3>
              <p className="text-xl font-black leading-tight mb-6">{job?.client_details?.name || job?.client?.name || "Loading..."}</p>
              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-blue-500">
                <div>
                    <label className="text-[10px] font-black text-blue-200 uppercase">VAT / TRN</label>
                    <input value={vatNo} onChange={(e) => setVatNo(e.target.value)} className="w-full bg-blue-700/50 border-none rounded-xl px-4 py-3 text-sm font-black placeholder:text-blue-400 focus:ring-2 focus:ring-white outline-none mt-1" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-blue-200 uppercase">Transport Ref (AWB/BL)</label>
                    <input value={billNo} onChange={(e) => setBillNo(e.target.value)} className="w-full bg-blue-700/50 border-none rounded-xl px-4 py-3 text-sm font-black placeholder:text-blue-400 focus:ring-2 focus:ring-white outline-none mt-1" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400"><span>Subtotal</span><span className="text-slate-900">{totals.subtotal.toFixed(3)}</span></div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400"><span>VAT (5%)</span><span className="text-blue-600">+{totals.vat.toFixed(3)}</span></div>
              <div className="pt-6 mt-2 border-t border-slate-100 flex justify-between items-end"><span className="text-xs font-black uppercase text-slate-900">Grand Total</span><span className="text-4xl font-black tracking-tighter text-slate-900 tabular-nums">{totals.grand.toFixed(3)}</span></div>
            </div>
          </div>
        </div>
      </main>

      {/* --- NEW MODAL FOR ADDING CUSTOM HEADER --- */}
      {isAddingType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 scale-100">
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">New Custom Header</h3>
              <p className="text-xs text-slate-400">Enter the name for this new charge category.</p>
            </div>
            
            <input 
              autoFocus
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Special Handling Fee"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChargeType()}
            />

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsAddingType(false)} 
                className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateChargeType} 
                disabled={!newTypeName.trim()} 
                className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
              >
                Save & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}