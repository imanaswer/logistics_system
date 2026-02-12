"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from '../../config'; 

// --- ICONS ---
const IconCheck = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>;
const IconPlus = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>;
const IconTrash = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;

// --- TYPES ---
interface InvoiceRow { 
  charge_type: string; 
  description: string; 
  amount: number | ""; 
  isTaxable: boolean; 
  vat: number; 
  total: number; 
}
interface ChargeType { id: number; name: string; }

const EMPTY_ROW: InvoiceRow = { charge_type: "", description: "", amount: "", isTaxable: false, vat: 0, total: 0 };

export default function InvoiceEditor() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId || params?.id;

  const [job, setJob] = useState<any>(null);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [rows, setRows] = useState<InvoiceRow[]>([EMPTY_ROW]);
  const [credits, setCredits] = useState(0); 
  
  // --- HEADER FIELDS ---
  const [customInvoiceNo, setCustomInvoiceNo] = useState("");
  const [supplierRef, setSupplierRef] = useState(""); 
  const [blNo, setBlNo] = useState(""); 
  const [supplierNote, setSupplierNote] = useState(""); 
  const [truckPayload, setTruckPayload] = useState(""); 

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalItemIds, setOriginalItemIds] = useState<number[]>([]);

  // --- NEW STATE: CUSTOM HEADER POPUP ---
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [targetRowIndex, setTargetRowIndex] = useState<number | null>(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!jobId) return;
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) { window.location.href = "/login"; return; }
      
      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        const [jobRes, chargeRes, itemRes, transRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/${jobId}/`, config),
          axios.get(`${API_URL}/api/chargetypes/`, config),
          axios.get(`${API_URL}/api/invoice-items/?job=${jobId}`, config),
          axios.get(`${API_URL}/api/transactions/`, config)
        ]);

        const jobData = jobRes.data;
        setJob(jobData);
        setChargeTypes(chargeRes.data);

        const paid = transRes.data
            .filter((t:any) => t.job === Number(jobId) && ['CR','BR'].includes(t.trans_type))
            .reduce((sum:number, t:any) => sum + Number(t.amount), 0);
        setCredits(paid);

        setCustomInvoiceNo(jobData.invoice_no || `INV-${new Date().getFullYear()}-${String(jobId).padStart(3, '0')}`);
        setBlNo(jobData.transport_document_no || "");

        let fullStr = jobData.shipment_invoice_no || "";
        let tempRef = "";
        let tempNote = "";
        let tempTrucks = "";

        if (fullStr.includes('(')) {
            const parts = fullStr.split('(');
            tempTrucks = parts.slice(1).join('(').replace(/\)$/, ''); 
            fullStr = parts[0].trim();
        } 
        
        if (fullStr.includes('|||')) {
            const parts = fullStr.split('|||');
            tempRef = parts[0].trim();
            tempNote = parts[1]?.trim() || "";
        } else if (fullStr.includes('||')) {
            const parts = fullStr.split('||');
            tempRef = parts[1].trim(); 
        } else {
            tempRef = fullStr;
        }

        setSupplierRef(tempRef);
        setSupplierNote(tempNote);
        setTruckPayload(tempTrucks);

        if (itemRes.data && itemRes.data.length > 0) {
            setRows(itemRes.data.map((i: any) => ({
                charge_type: String(i.charge_type),
                description: i.description,
                amount: Number(i.amount),
                isTaxable: Number(i.vat) > 0, 
                vat: Number(i.vat),
                total: Number(i.total),
            })));
            setOriginalItemIds(itemRes.data.map((i: any) => i.id));
        }

        setLoading(false);
      } catch (e) { console.error(e); setLoading(false); }
    };
    fetchData();
  }, [jobId]);

  // --- NEW FUNCTION: SAVE NEW HEADER ---
  const handleCreateChargeType = async () => {
    const token = localStorage.getItem("token");
    if (!newTypeName.trim() || !token) return;
    try {
      const config = { headers: { Authorization: `Token ${token}` } };
      const res = await axios.post(`${API_URL}/api/chargetypes/`, { name: newTypeName }, config);
      const newType = res.data;
      
      setChargeTypes((prev) => [...prev, newType]);
      if (targetRowIndex !== null) {
        updateRow(targetRowIndex, "charge_type", String(newType.id));
      }
      
      setIsAddingType(false);
      setNewTypeName("");
      setTargetRowIndex(null);
    } catch (err) {
      alert("Failed to add header.");
    }
  };

  // --- 2. ROW UPDATER ---
  const updateRow = (index: number, field: keyof InvoiceRow, value: any) => {
    setRows(prev => {
        const next = [...prev];
        const row = { ...next[index], [field]: value };
        
        if (field === 'charge_type') {
            const typeObj = chargeTypes.find(c => String(c.id) === value);
            if (typeObj) { 
                row.isTaxable = !!typeObj.name.toLowerCase().match(/custom|transport|handling|agency|clearance/);
            }
        }

        const amt = Number(row.amount) || 0;
        if (field === 'amount' || field === 'isTaxable' || field === 'charge_type') {
            row.vat = row.isTaxable ? amt * 0.05 : 0;
            row.total = amt + row.vat;
        }

        next[index] = row;
        return next;
    });
  };

  // --- 3. SAVE ---
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    let formattedTrucks = truckPayload.trim();
    if (formattedTrucks && !formattedTrucks.startsWith('(')) {
        formattedTrucks = ` (${formattedTrucks})`;
    } else if (formattedTrucks) {
        formattedTrucks = ` ${formattedTrucks}`; 
    }

    const packedString = `${supplierRef} ||| ${supplierNote}${formattedTrucks}`;
    if (packedString.length > 1000) return alert("Text too long.");

    setSaving(true);
    try {
        const config = { headers: { Authorization: `Token ${token}` } };
        
        // STEP 1: Update job metadata (WITHOUT is_invoiced yet)
        await axios.patch(`${API_URL}/api/jobs/${jobId}/`, {
            invoice_no: customInvoiceNo,
            transport_document_no: blNo, 
            shipment_invoice_no: packedString, 
            vat_number: job.vat_number
        }, config);

        // STEP 2: Delete old invoice items
        await Promise.allSettled(originalItemIds.map(id => axios.delete(`${API_URL}/api/invoice-items/${id}/`, config)));
        
        // STEP 3: Create new invoice items
        const validRows = rows.filter(r => r.charge_type && Number(r.amount) > 0);
        await Promise.all(validRows.map(r => axios.post(`${API_URL}/api/invoice-items/`, {
            job: Number(jobId),
            charge_type: Number(r.charge_type),
            description: r.description,
            amount: Number(r.amount),
            vat: Number(r.vat.toFixed(3)),
            total: Number(r.total.toFixed(3))
        }, config)));

        // STEP 4: Mark job as invoiced (triggers signal to create shadow transaction)
        await axios.patch(`${API_URL}/api/jobs/${jobId}/`, {
            is_invoiced: true
        }, config);

        router.push(`/invoices/${jobId}/view`);
    } catch (e) { alert("Save failed"); setSaving(false); }
  };

  const totals = useMemo(() => rows.reduce((acc, r) => ({
      sub: acc.sub + (Number(r.amount)||0),
      vat: acc.vat + r.vat,
      total: acc.total + r.total
  }), { sub: 0, vat: 0, total: 0 }), [rows]);

  const balanceDue = totals.total - credits;

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">LOADING...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex justify-center items-center font-sans text-slate-900">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* LEFT: MAIN FORM */}
        <div className="flex-grow p-8 md:p-10 flex flex-col relative">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-black tracking-tight mb-1 flex items-center gap-3">
                        <span className="bg-black text-white p-2 rounded-lg"><IconCheck /></span>
                        Billing Generator
                    </h1>
                    <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                        <span>Job ID: #{jobId}</span>
                        <span>|</span>
                        <span>Date: {job.job_date}</span>
                    </div>
                </div>
                <button onClick={() => router.push("/")} className="text-slate-400 hover:text-red-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Invoice No</label>
                        <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" value={customInvoiceNo} onChange={e => setCustomInvoiceNo(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Supplier Reference</label>
                        <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" value={supplierRef} onChange={e => setSupplierRef(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">BL / Ref No</label>
                        <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" value={blNo} onChange={e => setBlNo(e.target.value)} placeholder="e.g. AWB-123456" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Logistics Manifest (Qty + Type)</label>
                        <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" value={truckPayload} onChange={e => setTruckPayload(e.target.value)} placeholder="e.g. 1x40 ft reefer" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Supplier Information / Description</label>
                    <textarea className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-500 h-20 resize-none" value={supplierNote} onChange={e => setSupplierNote(e.target.value)} placeholder="Enter details..." />
                </div>
            </div>

            <div className="flex justify-between items-end mb-2 px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Item Details</span>
                <button onClick={() => setRows([...rows, { ...EMPTY_ROW }])} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline"><IconPlus /> Add New Row</button>
            </div>

            <div className="space-y-3 mb-8">
                {rows.map((row, i) => (
                    <div key={i} className="flex gap-3 items-center group">
                        <select 
                            className="w-1/4 bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold focus:border-blue-500 outline-none shadow-sm"
                            value={row.charge_type}
                            onChange={(e) => {
                                if (e.target.value === "ADD_NEW") {
                                    setTargetRowIndex(i);
                                    setIsAddingType(true);
                                } else {
                                    updateRow(i, "charge_type", e.target.value);
                                }
                            }}
                        >
                            <option value="">-- Type --</option>
                            {chargeTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            <option value="ADD_NEW" className="font-black text-blue-600 bg-blue-50">+ Add Custom Header...</option>
                        </select>
                        
                        <input className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold focus:border-blue-500 outline-none shadow-sm" placeholder="Details..." value={row.description} onChange={(e) => updateRow(i, "description", e.target.value)} />
                        
                        <div className="flex items-center justify-center px-1" title="Apply 5% VAT">
                            <input type="checkbox" checked={row.isTaxable} onChange={(e) => updateRow(i, "isTaxable", e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600" />
                        </div>

                        <input type="number" className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-right focus:border-blue-500 outline-none shadow-sm" placeholder="0.000" value={row.amount} onChange={(e) => updateRow(i, "amount", e.target.value)} />
                        <button onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition"><IconTrash /></button>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT: SUMMARY SIDEBAR */}
        <div className="w-full md:w-96 bg-slate-50 border-l border-slate-200 p-8 md:p-10 flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Accounting Summary</h3>
            <div className="space-y-4 text-sm font-bold text-slate-600 mb-8">
                <div className="flex justify-between"><span>Gross Subtotal</span><span>{totals.sub.toFixed(3)}</span></div>
                <div className="flex justify-between text-blue-600"><span>Tax (Oman 5%)</span><span>+{totals.vat.toFixed(3)}</span></div>
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between text-slate-900"><span>Invoice Amount</span><span>{totals.total.toFixed(3)}</span></div>
                {credits > 0 && <div className="flex justify-between text-emerald-600 text-xs"><span>Prior Credits</span><span>-{credits.toFixed(3)}</span></div>}
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl mb-8">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Net Balance Due (OMR)</span>
                <span className="block text-4xl font-black tracking-tight">{balanceDue > 0 ? balanceDue.toFixed(3) : "0.000"}</span>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition text-xs uppercase tracking-widest disabled:opacity-50">
                {saving ? "Processing..." : "Finalize & Record"}
            </button>
        </div>
      </div>

      {/* --- NEW MODAL FOR ADDING CUSTOM HEADER --- */}
      {isAddingType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">New Custom Header</h3>
              <p className="text-xs text-slate-400">Add a new category to your billing types.</p>
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
              <button onClick={() => setIsAddingType(false)} className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition">Cancel</button>
              <button onClick={handleCreateChargeType} disabled={!newTypeName.trim()} className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-blue-600 shadow-lg transition disabled:opacity-50">Save & Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}