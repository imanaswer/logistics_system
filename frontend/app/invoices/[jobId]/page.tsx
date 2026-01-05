"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
// 1. Import the global config
import { API_URL } from '../../config'; 

// Define Types for better DX
interface ChargeType {
  id: number;
  name: string;
}

interface InvoiceItem {
  charge_type: string;
  description: string;
  amount: string;
  isTaxable: boolean;
}

export default function InvoicePage() {
  const router = useRouter();
  const { jobId } = useParams();

  /* ================= STATE ================= */
  const [job, setJob] = useState<any>(null);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([
    { charge_type: "", description: "", amount: "", isTaxable: false },
  ]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ================= INIT ================= */
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      const config = { headers: { Authorization: `Token ${token}` } };

      try {
        // 2. Use API_URL here
        const [jobRes, chargeRes, txRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/${jobId}/`, config),
          axios.get(`${API_URL}/api/chargetypes/`, config),
          axios.get(`${API_URL}/api/transactions/`, config),
        ]);

        setJob(jobRes.data);
        setChargeTypes(chargeRes.data);
        setPayments(
          txRes.data.filter(
            (t: any) => t.job === Number(jobId) && ["CR", "BR"].includes(t.trans_type)
          )
        );
      } catch (err) {
        console.error("Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [jobId, router]);

  /* ================= HELPERS & CALCULATIONS ================= */
  const handleChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill logic when category changes
    if (field === "charge_type") {
      const selected = chargeTypes.find((c) => c.id.toString() === value);
      if (selected) {
        updated[index].description = selected.name;
        const keywords = ["custom", "clearance", "handling", "transport", "agency"];
        updated[index].isTaxable = keywords.some((k) =>
          selected.name.toLowerCase().includes(k)
        );
      }
    }
    setItems(updated);
  };

  const removeRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const addRow = () => {
    setItems([...items, { charge_type: "", description: "", amount: "", isTaxable: false }]);
  };

  // UseMemo for performance: only recalculate totals when items change
  const totals = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        const amt = parseFloat(i.amount) || 0;
        acc.subtotal += amt;
        if (i.isTaxable) acc.vat += amt * 0.05;
        return acc;
      },
      { subtotal: 0, vat: 0 }
    );
  }, [items]);

  const invoiceTotal = totals.subtotal + totals.vat;
  const credit = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balanceDue = Math.max(invoiceTotal - credit, 0);
  const isPaid = balanceDue <= 0 && totals.subtotal > 0;

  /* ================= SAVE LOGIC ================= */
  const handleSave = async () => {
    const validItems = items.filter((i) => i.charge_type && parseFloat(i.amount) > 0);
    
    if (validItems.length === 0) {
      return alert("Please enter at least one valid line item with an amount.");
    }

    setSaving(true);
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Token ${token}` } };

    try {
      // Logic: Using Promise.all for faster execution, though backend atomicity is preferred
      await Promise.all(
        validItems.map((i) => {
          const amount = parseFloat(i.amount);
          const vat = i.isTaxable ? amount * 0.05 : 0;
          // 3. Use API_URL here
          return axios.post(
            `${API_URL}/api/invoice-items/`,
            {
              job: Number(jobId),
              charge_type: Number(i.charge_type),
              description: i.description,
              amount: amount,
              vat: Number(vat.toFixed(3)),
              total: Number((amount + vat).toFixed(3)),
            },
            config
          );
        })
      );
      router.push(`/jobs/${jobId}/view`);
    } catch (err) {
      console.error(err);
      alert("Failed to save invoice records. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-black tracking-tighter">INITIALIZING LEDGER...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-12 font-sans antialiased text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-white rounded-t-3xl border-x border-t border-slate-300 p-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-6">
            <div className="bg-slate-900 text-white p-4 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-black text-black tracking-tight leading-none mb-1">Billing Generator</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Job ID: <span className="text-blue-600 font-black">#{jobId}</span> • <span>{job?.client?.name || job?.client_details?.name || "Unknown Client"}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-[0.2em] border-2 ${isPaid ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
              {isPaid ? "STOCKED / PAID" : "ACCOUNT PENDING"}
            </span>
            <button 
              onClick={() => router.back()} 
              className="group flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 transition-all"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="grid grid-cols-12 gap-0 bg-white rounded-b-3xl shadow-2xl border-x border-b border-slate-300 overflow-hidden">
          
          {/* CHARGE ENTRY SECTION */}
          <div className="col-span-12 lg:col-span-8 p-6 md:p-10 border-r border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Line Item Details</h3>
              <button 
                onClick={addRow}
                className="group text-[10px] font-black text-blue-600 hover:text-black uppercase tracking-widest flex items-center gap-2 transition"
              >
                <span className="text-lg group-hover:scale-125 transition-transform">+</span> Add New Row
              </button>
            </div>

            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">
                <div className="col-span-4">Charge Category</div>
                <div className="col-span-4">Specific Description</div>
                <div className="col-span-1 text-center">VAT</div>
                <div className="col-span-3 text-right pr-6">Amount (OMR)</div>
              </div>

              {items.map((i, idx) => (
                <div key={idx} className="group grid grid-cols-12 gap-3 md:gap-4 bg-slate-50 p-3 rounded-2xl border-2 border-transparent hover:border-blue-100 hover:bg-white transition-all items-center">
                  <select
                    className="col-span-12 md:col-span-4 bg-white border-2 border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500 transition"
                    value={i.charge_type}
                    onChange={(e) => handleChange(idx, "charge_type", e.target.value)}
                  >
                    <option value="">-- Type --</option>
                    {chargeTypes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>

                  <input
                    className="col-span-12 md:col-span-4 bg-white border-2 border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500 transition"
                    value={i.description}
                    onChange={(e) => handleChange(idx, "description", e.target.value)}
                    placeholder="Details..."
                  />

                  <div className="col-span-6 md:col-span-1 flex md:justify-center items-center gap-2">
                    <span className="md:hidden text-[10px] font-bold text-slate-400">VAT?</span>
                    <input
                      type="checkbox"
                      checked={i.isTaxable}
                      onChange={(e) => handleChange(idx, "isTaxable", e.target.checked)}
                      className="w-6 h-6 rounded-lg border-2 border-slate-300 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-3 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.001"
                      className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-right text-sm font-black outline-none focus:border-blue-500 transition"
                      value={i.amount}
                      onChange={(e) => handleChange(idx, "amount", e.target.value)}
                      placeholder="0.000"
                    />
                    <button 
                      onClick={() => removeRow(idx)} 
                      className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FINANCIAL SUMMARY SECTION */}
          <div className="col-span-12 lg:col-span-4 bg-slate-50/50 p-6 md:p-10 flex flex-col justify-between border-t lg:border-t-0">
            <div className="space-y-6">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-4">Accounting Summary</p>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-500 uppercase tracking-tighter">Gross Subtotal</span>
                  <span>{totals.subtotal.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-500 uppercase tracking-tighter">Tax (Oman 5%)</span>
                  <span className="text-blue-600">+{totals.vat.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-4">
                  <span className="text-black uppercase tracking-tighter">Invoice Amount</span>
                  <span className="font-black underline decoration-slate-200 underline-offset-4">{invoiceTotal.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold italic">
                  <span className="text-emerald-600 uppercase tracking-tighter underline">Prior Credits Received</span>
                  <span className="text-emerald-600 font-black">-{credit.toFixed(3)}</span>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Net Balance Due (OMR)</p>
                <div className="text-5xl font-black tracking-tighter">
                  {balanceDue.toFixed(3)}
                </div>
              </div>
            </div>

            <button
              disabled={isPaid || saving || totals.subtotal === 0}
              onClick={handleSave}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all transform active:scale-95 mt-10 ${
                isPaid
                  ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200 cursor-not-allowed"
                  : saving
                  ? "bg-slate-400 text-white cursor-wait"
                  : "bg-blue-600 text-white hover:bg-black hover:shadow-blue-500/20"
              }`}
            >
              {saving ? "Processing Ledger..." : isPaid ? "Document Fully Balanced" : "Finalize & Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}