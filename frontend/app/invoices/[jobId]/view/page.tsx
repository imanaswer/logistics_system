"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from '../../../config';

/* --- FONT --- */
const fontLink = (
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
);

interface InvoiceItem {
  id: number;
  description: string;
  amount: string;
  vat: string;
}

export default function InvoiceView() {
  const router = useRouter();
  const params = useParams();
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ID EXTRACTION ---
  useEffect(() => {
    if (params?.id) {
      setJobId(Array.isArray(params.id) ? params.id[0] : params.id);
      return;
    }
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/');
      const found = segments.find(s => !isNaN(Number(s)) && s.trim() !== '');
      if (found) setJobId(found);
    }
  }, [params]);

  // --- FETCH DATA ---
  useEffect(() => {
    if (!jobId) return;
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) { window.location.href = "/login"; return; }
      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        const [jobRes, itemsRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/${jobId}/`, config),
          axios.get(`${API_URL}/api/invoice-items/?job=${jobId}`, config)
        ]);
        setJob(jobRes.data);
        setItems(itemsRes.data);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchData();
  }, [jobId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-xs font-bold uppercase tracking-widest">Loading...</div>;

  // --- SMART DATA PARSING ---
  let fullRef = job?.shipment_invoice_no || '';
  let displayRef = '-';
  let manifestDetails = null;

  // Logic: Separate "Ref No" from "Truck List"
  if (fullRef.includes('(')) {
      // Format: "REF-001 (1x 20ft, 1x 3ton)"
      const parts = fullRef.split('(');
      displayRef = parts[0].trim();
      manifestDetails = parts[1].replace(')', '').trim();
  } else if (fullRef.match(/\d+x/i) || fullRef.toLowerCase().includes('ft') || fullRef.toLowerCase().includes('ton')) {
      // Format: "1x 20ft, 1x 3ton" (No Ref No provided)
      manifestDetails = fullRef;
      displayRef = '-'; // Set Ref to empty since the whole field was trucks
  } else {
      // Format: "REF-001" (No trucks)
      displayRef = fullRef || '-';
  }

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
  const totalVat = items.reduce((sum, item) => sum + parseFloat(item.vat || '0'), 0);
  const grandTotal = subtotal + totalVat;
  
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(jobId).padStart(4, '0')}`;
  const today = new Date().toLocaleDateString('en-GB');
  const currency = (amt: number) => amt.toLocaleString('en-OM', { style: 'currency', currency: 'OMR', minimumFractionDigits: 3 });

  return (
    <>
      {fontLink}
      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; color: #111; }
        @media print { 
            @page { margin: 0; size: A4 portrait; }
            body { background: white; margin: 0; }
            .print-hidden { display: none !important; }
            .print-safe { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .a4-container { height: 297mm; overflow: hidden; display: flex; flex-direction: column; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 py-8 flex justify-center print:bg-white print:p-0 print:h-screen">
        
        {/* --- A4 PAGE --- */}
        <div className="a4-container bg-white w-[210mm] min-h-[297mm] shadow-xl print:shadow-none flex flex-col relative text-slate-900">
          
          {/* 1. HEADER */}
          <div className="bg-[#111] text-white px-10 py-8 print-safe flex justify-between items-start">
              <div>
                  <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-lg text-white">L</div>
                      <h1 className="text-xl font-black tracking-tight uppercase">Logistics ERP</h1>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                      <p>Muscat, Sultanate of Oman | TRN: OM123456789</p>
                  </div>
              </div>
              <div className="text-right">
                  <h2 className="text-4xl font-black tracking-tighter leading-none mb-1">INVOICE</h2>
                  <p className="text-sm font-bold text-blue-400">{invoiceNo}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Date: {today}</p>
              </div>
          </div>

          {/* 2. MAIN GRID */}
          <div className="px-10 py-6">
              <div className="flex gap-10 border-b border-slate-100 pb-8">
                  
                  {/* CLIENT */}
                  <div className="w-5/12 flex flex-col justify-center">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bill To</h3>
                      <p className="text-xl font-bold text-slate-900 leading-none mb-2">{job.client?.name || "Cash Customer"}</p>
                      <p className="text-xs text-slate-600 leading-snug whitespace-pre-line mb-3">
                          {job.client?.address || "Address Not Provided"}
                      </p>
                      <div className="inline-flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">VAT NO</span>
                          <span className="text-[10px] font-bold text-slate-900">{job.vat_number || "N/A"}</span>
                      </div>
                  </div>

                  {/* DETAILS */}
                  <div className="w-7/12 bg-slate-50 p-5 rounded-lg border border-slate-100">
                      
                      {/* Top Row */}
                      <div className="grid grid-cols-4 gap-4 mb-4 border-b border-slate-200 pb-4">
                          <div><span className="block text-[9px] font-bold text-slate-400 uppercase">Job Ref</span><span className="text-xs font-bold text-slate-900">#{jobId}</span></div>
                          <div className="col-span-2"><span className="block text-[9px] font-bold text-slate-400 uppercase">Ref No</span><span className="text-xs font-bold text-slate-900 truncate block">{displayRef}</span></div>
                          <div><span className="block text-[9px] font-bold text-slate-400 uppercase">Mode</span><span className="text-xs font-bold text-slate-900 uppercase">{job.transport_mode}</span></div>
                      </div>

                      {/* Routing */}
                      <div className="flex justify-between items-center mb-4 text-xs">
                          <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Origin</span><span className="font-bold text-slate-900">{job.port_loading}</span></div>
                          <div className="text-slate-300 px-4">✈︎ ➝</div>
                          <div className="text-right"><span className="text-[9px] font-bold text-slate-400 uppercase block">Destination</span><span className="font-bold text-slate-900">{job.port_discharge}</span></div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-4 text-[10px]">
                           <div><span className="text-slate-400 uppercase font-bold">Pkgs:</span> <span className="font-bold">{job.no_of_packages || '0'}</span></div>
                           <div><span className="text-slate-400 uppercase font-bold">G.Wt:</span> <span className="font-bold">{job.gross_weight || '0'}</span></div>
                           <div><span className="text-slate-400 uppercase font-bold">N.Wt:</span> <span className="font-bold">{job.net_weight || '0'}</span></div>
                           <div><span className="text-slate-400 uppercase font-bold">Vol:</span> <span className="font-bold">{job.cbm || '0'}</span></div>
                      </div>
                  </div>
              </div>
          </div>

          {/* 3. TRUCK / CONTAINER STRIP (Blue Bar) */}
          {manifestDetails && (
             <div className="px-10 mb-4 print:mb-4">
                 <div className="bg-blue-50 border-l-4 border-blue-600 px-4 py-3 flex items-center gap-3 text-xs print-safe shadow-sm">
                     <span className="text-blue-600">
                        {/* Truck Icon */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                     </span>
                     <span className="font-black text-blue-900 uppercase tracking-wide text-[10px]">Container / Vehicle Manifest:</span>
                     <span className="font-bold text-slate-900 flex-grow uppercase">{manifestDetails}</span>
                 </div>
             </div>
          )}

          {/* 4. TABLE */}
          <div className="px-10 flex-grow overflow-hidden">
              <table className="w-full mb-4">
                  <thead>
                      <tr className="border-b-2 border-slate-900">
                          <th className="py-2 text-left text-[10px] font-black text-slate-900 uppercase tracking-widest w-12">#</th>
                          <th className="py-2 text-left text-[10px] font-black text-slate-900 uppercase tracking-widest">Description</th>
                          <th className="py-2 text-center text-[10px] font-black text-slate-900 uppercase tracking-widest w-20">VAT</th>
                          <th className="py-2 text-right text-[10px] font-black text-slate-900 uppercase tracking-widest w-32">Amount</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {items.map((item, i) => (
                          <tr key={i}>
                              <td className="py-3 text-[11px] font-bold text-slate-400 align-top">{String(i + 1).padStart(2, '0')}</td>
                              <td className="py-3 text-[12px] font-bold text-slate-800 align-top">{item.description}</td>
                              <td className="py-3 text-center text-[11px] font-bold text-slate-500 align-top">{parseFloat(item.vat) > 0 ? '5%' : '-'}</td>
                              <td className="py-3 text-right text-[12px] font-bold text-slate-900 align-top">{parseFloat(item.amount).toFixed(3)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          {/* 5. FOOTER */}
          <div className="bg-slate-50 px-10 py-6 mt-auto border-t border-slate-200 print-safe">
              <div className="flex justify-end mb-4">
                  <div className="w-72 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-2 border-b border-slate-200"><span>VAT (5%)</span><span>{currency(totalVat)}</span></div>
                      <div className="flex justify-between items-center pt-1">
                          <span className="text-base font-black text-slate-900 uppercase tracking-tight">Total Due</span>
                          <span className="text-2xl font-black text-blue-600 tracking-tighter">{currency(grandTotal)}</span>
                      </div>
                  </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                      <p className="font-bold text-slate-900 mb-1 uppercase">Bank Transfer Details</p>
                      <p>Bank Muscat | AC: <span className="font-mono text-slate-700 font-bold">0333-1234-5678-9000</span></p>
                      <p>Swift: <span className="font-mono text-slate-700 font-bold">BMUSOMRX</span></p>
                  </div>
                  <div className="text-right">
                      <div className="mb-6 text-slate-900 font-bold uppercase">Authorized Signature</div>
                      <div className="h-px w-40 bg-slate-300"></div>
                  </div>
              </div>
          </div>

          {/* ACTIONS */}
          <div className="fixed bottom-8 right-8 print-hidden z-50 flex gap-2">
             <button onClick={() => router.back()} className="bg-white text-slate-700 font-bold py-3 px-5 rounded-full shadow-lg border border-slate-200 text-xs hover:bg-slate-50">Close</button>
             <button onClick={() => window.print()} className="bg-slate-900 text-white font-bold py-3 px-6 rounded-full shadow-xl hover:bg-black text-xs flex items-center gap-2">
                  <span>Print PDF</span>
              </button>
          </div>

        </div>
      </div>
    </>
  );
}