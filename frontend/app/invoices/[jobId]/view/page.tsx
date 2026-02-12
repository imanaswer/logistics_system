"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from '../../../config';

const fontLink = (
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
);

interface InvoiceItem {
  id: number;
  charge_type: number;
  description: string;
  amount: string;
  vat: string;
}

interface ChargeType {
    id: number;
    name: string;
}

export default function InvoiceView() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId || params?.id;
  
  const [job, setJob] = useState<any>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) { window.location.href = "/login"; return; }
      try {
        const config = { headers: { Authorization: `Token ${token}` } };
        
        const [jobRes, itemsRes, transRes, chargeRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/${jobId}/`, config),
          axios.get(`${API_URL}/api/invoice-items/?job=${jobId}`, config),
          axios.get(`${API_URL}/api/transactions/`, config),
          axios.get(`${API_URL}/api/chargetypes/`, config) 
        ]);

        setJob(jobRes.data);
        setItems(itemsRes.data);
        setChargeTypes(chargeRes.data);

        const jobTransactions = transRes.data.filter((t: any) => 
            t.job === Number(jobId) && ['CR', 'BR'].includes(t.trans_type)
        );
        const totalPaid = jobTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        setCredits(totalPaid);

        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchData();
  }, [jobId]);

  // --- HELPER: FORMAT DATE TO DD/MM/YYYY ---
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-sm uppercase">Loading Document...</div>;

  const getChargeName = (id: number) => {
      const found = chargeTypes.find(c => c.id === id);
      return found ? found.name : "";
  };

  // --- PARSING LOGIC ---
  let rawStr = job?.shipment_invoice_no || "";
  let invoiceNo = job?.invoice_no || "";
  let blNo = job?.transport_document_no || "-";
  
  let supplierRef = "-";
  let supplierNote = "";
  let truckManifest = "";

  if (rawStr.includes('(')) {
      const parts = rawStr.split('(');
      truckManifest = parts.slice(1).join('(').replace(/\)$/, '').trim();
      rawStr = parts[0].trim();
  } else if (rawStr.match(/(\d+x|ft|ton)/i)) {
      truckManifest = rawStr; rawStr = "";
  }

  if (truckManifest) {
      truckManifest = truckManifest.replace(/^1x\s+1x/i, "1x");
      truckManifest = truckManifest.replace(/^\s+/, "");
  }

  if (rawStr.includes('|||')) {
      const parts = rawStr.split('|||');
      supplierRef = parts[0].trim();
      supplierNote = parts[1]?.trim() || "";
  } else if (rawStr.includes('||')) {
      const parts = rawStr.split('||');
      if (!invoiceNo) invoiceNo = parts[0].trim();
      supplierRef = parts[1].trim();
  } else if (rawStr) {
      supplierRef = rawStr;
  }

  if (!invoiceNo) invoiceNo = `INV-${String(jobId).padStart(4, '0')}`;
  
  const clientVat = job.vat_number || job.client?.vat_number || "-";
  const clientPhone = job.client?.phone || "-";

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
  const totalVat = items.reduce((sum, item) => sum + parseFloat(item.vat || '0'), 0);
  const invoiceTotal = subtotal + totalVat;
  const balanceDue = invoiceTotal - credits;

  const currency = (amt: number) => amt.toLocaleString('en-OM', { minimumFractionDigits: 3 });

  return (
    <>
      {fontLink}
      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; color: #000; }
        .font-mono { font-family: 'JetBrains Mono', monospace; letter-spacing: -0.5px; }
        @media print { 
            @page { margin: 0; size: A4 portrait; }
            body { background: white; margin: 0; }
            .print-hidden { display: none !important; }
            .a4-container { height: 297mm; display: flex; flex-direction: column; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 py-8 flex justify-center print:bg-white print:p-0 print:h-screen">
        <div className="a4-container bg-white w-[210mm] min-h-[297mm] shadow-xl print:shadow-none flex flex-col relative text-black p-12 box-border">
          
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
              <div className="w-2/3">
                  <h1 className="text-2xl font-black uppercase tracking-tight leading-none mb-2 text-blue-900">SPEED INTERNATIONAL BUSINESS LLC</h1>
                  <div className="text-[10px] font-bold uppercase tracking-wider space-y-1 text-gray-700">
                      <p>C.R NO: 1248289 | P.O BOX: 1432 | P.C 114</p>
                      <p>JIBROO, MUSCAT SULTANATE OF OMAN</p>
                      <p>VATIN: OM1100244831</p>
                      <p className="lowercase">E-Mail: speedinternationalshipping@gmail.com</p>
                  </div>
              </div>
              <div className="text-right w-1/3">
                  <h2 className="text-5xl font-black tracking-tighter leading-none mb-2">INVOICE</h2>
                  <div className="inline-block text-right">
                      <p className="text-sm font-bold border-b border-black pb-1 mb-1">No: <span className="font-mono text-lg ml-2">{invoiceNo}</span></p>
                      <p className="text-xs font-bold text-gray-600">Date: {formatDate(job.job_date)}</p>
                  </div>
              </div>
          </div>

          {/* BILL TO */}
          <div className="flex justify-between gap-8 mb-6">
              <div className="w-1/2 bg-slate-50 p-4 rounded-sm border-l-4 border-blue-900">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Bill To</h3>
                  <p className="text-lg font-bold uppercase leading-none mb-1">{job.client?.name}</p>
                  <p className="text-xs font-medium text-gray-600 whitespace-pre-wrap leading-snug mb-2">{job.client?.address}</p>
                  <div className="flex gap-4 text-[10px] uppercase font-bold text-gray-500">
                      <p>VAT: <span className="font-mono text-black">{clientVat}</span></p>
                      <p>PH: <span className="font-mono text-black">{clientPhone}</span></p>
                  </div>
              </div>
              
              <div className="w-1/2 flex flex-col justify-start space-y-4">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-[10px] font-black uppercase text-gray-400">Supplier Ref</span>
                      <span className="text-sm font-bold">{supplierRef}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-[10px] font-black uppercase text-gray-400">BL / Ref No</span>
                      <span className="text-sm font-bold">{blNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-[10px] font-black uppercase text-gray-400">Job ID</span>
                      <span className="text-sm font-bold">#{jobId}</span>
                  </div>
              </div>
          </div>

          {/* SUPPLIER NOTE */}
          {supplierNote && supplierNote !== "" && (
              <div className="mb-6 p-4 border border-gray-300 rounded bg-white shadow-sm">
                  <h4 className="text-[9px] font-black uppercase text-gray-400 mb-2 border-b border-gray-100 pb-1">Supplier Description / Notes</h4>
                  <p className="text-xs font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">{supplierNote}</p>
              </div>
          )}

          {/* STRIP */}
          <div className="bg-gray-100 py-2 px-4 mb-4 flex justify-between items-center text-xs border border-gray-200">
              <div className="w-1/3">
                  <span className="text-[9px] font-black uppercase text-gray-400 mr-2">Mode</span>
                  <span className="font-bold uppercase">{job.transport_mode}</span>
              </div>
              <div className="w-1/3 text-center">
                  <span className="text-[9px] font-black uppercase text-gray-400 mr-2">Routing</span>
                  <span className="font-bold">{job.port_loading} <span className="text-gray-400 mx-2">➝</span> {job.port_discharge}</span>
              </div>
              <div className="w-1/3 text-right">
                  <span className="text-[9px] font-black uppercase text-gray-400 mr-2">Pkgs</span>
                  <span className="font-bold">{job.no_of_packages}</span>
              </div>
          </div>

          {/* MANIFEST */}
          {truckManifest && (
             <div className="mb-6">
                 <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Description of Goods / Manifest</p>
                 <p className="text-xs font-bold uppercase border-l-2 border-gray-300 pl-3">{truckManifest}</p>
             </div>
          )}

          {/* TABLE */}
          <div className="flex-grow">
              <table className="w-full mb-4">
                  <thead>
                      <tr className="border-b-2 border-black">
                          <th className="py-2 text-left text-[10px] font-black uppercase tracking-wider w-10">No</th>
                          <th className="py-2 text-left text-[10px] font-black uppercase tracking-wider">Description</th>
                          <th className="py-2 text-center text-[10px] font-black uppercase tracking-wider w-16">VAT</th>
                          <th className="py-2 text-right text-[10px] font-black uppercase tracking-wider w-28">Amount (OMR)</th>
                      </tr>
                  </thead>
                  <tbody className="text-xs">
                      {items.map((item, i) => {
                          const chargeName = getChargeName(item.charge_type);
                          return (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-2 font-bold text-gray-400 align-top">{String(i + 1).padStart(2, '0')}</td>
                                <td className="py-2 align-top">
                                    <span className="font-bold block text-gray-900 text-xs">{chargeName || "Charge"}</span>
                                    {item.description && <span className="block text-gray-500 text-[10px] mt-0.5">{item.description}</span>}
                                </td>
                                <td className="py-2 text-center align-top mt-1">{parseFloat(item.vat) > 0 ? '5%' : '-'}</td>
                                <td className="py-2 text-right font-bold align-top font-mono">{parseFloat(item.amount).toFixed(3)}</td>
                            </tr>
                          );
                      })}
                      {items.length === 0 && (
                          <tr><td colSpan={4} className="py-8 text-center text-gray-400 italic">No line items added yet.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* FOOTER */}
          <div className="mt-auto pt-4 border-t-2 border-black">
              <div className="flex justify-end mb-6">
                  <div className="w-80">
                      <div className="flex justify-between text-xs font-medium mb-1 text-gray-600">
                          <span>Subtotal</span>
                          <span className="font-bold font-mono">{currency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium mb-3 text-gray-600">
                          <span>VAT (5%)</span>
                          <span className="font-bold font-mono">{currency(totalVat)}</span>
                      </div>
                      
                      <div className="h-px bg-black mb-3 opacity-20"></div>

                      <div className="flex justify-between items-center text-sm font-bold mb-1">
                          <span className="uppercase">Total Amount</span>
                          <span className="font-mono text-base">{currency(invoiceTotal)}</span>
                      </div>

                      {credits > 0 && (
                          <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-3">
                              <span>Less: Paid</span>
                              <span className="font-mono">- {currency(credits)}</span>
                          </div>
                      )}

                      <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-black">
                          <span className="text-sm font-black uppercase tracking-widest">Balance Due</span>
                          <span className="text-2xl font-black font-mono text-blue-900">OMR {currency(balanceDue)}</span>
                      </div>
                  </div>
              </div>
              
              <div className="flex justify-between items-end text-[10px] font-bold uppercase">
                  <div>
                      <p className="text-gray-500 mb-1">Bank Transfer Details</p>
                      <p>Bank Muscat | AC: 0423047396890014</p>
                      <p>Swift: BMUSOMRX</p>
                  </div>
                  <div className="text-right">
                      <div className="mb-8">Authorized Signature</div>
                      <div className="h-px w-48 bg-black"></div>
                  </div>
              </div>
          </div>

          {/* ACTIONS */}
          <div className="print-hidden fixed bottom-8 right-8 flex gap-2">
             <button onClick={() => router.push("/")} className="bg-white text-black font-bold py-3 px-6 rounded-full shadow-lg border border-gray-300 text-xs">Close</button>
             <button onClick={() => router.push(`/invoices/${jobId}`)} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg text-xs">Edit Invoice</button>
             <button onClick={() => window.print()} className="bg-black text-white font-bold py-3 px-8 rounded-full shadow-xl text-xs">Print</button>
          </div>

        </div>
      </div>
    </>
  );
}