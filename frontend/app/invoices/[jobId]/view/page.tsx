"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
// 1. Import the global config
import { API_URL } from '../../../config'; 
export default function ProfessionalInvoiceView() {
  const router = useRouter();
  const { jobId } = useParams();

  const [job, setJob] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const config = { headers: { Authorization: `Token ${token}` } };

        // 2. Use API_URL here
        const [jobRes, itemsRes, txRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/${jobId}/?t=${Date.now()}`, config),
          axios.get(`${API_URL}/api/invoice-items/?t=${Date.now()}`, config),
          axios.get(`${API_URL}/api/transactions/?t=${Date.now()}`, config),
        ]);

        setJob(jobRes.data);
        setItems(itemsRes.data.filter((i: any) => i.job == jobId));

        setPayments(
          txRes.data.filter(
            (t: any) =>
              t.job === Number(jobId) &&
              ["CR", "BR"].includes(t.trans_type)
          )
        );
      } catch (error) {
        console.error("Invoice PDF Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) fetchData();
  }, [jobId]);

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-black uppercase tracking-widest">
        Generating Document...
      </div>
    );
  }

  /* ================= CALCULATIONS ================= */

  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.amount),
    0
  );

  const vat = items.reduce(
    (sum, i) => sum + Number(i.vat || 0),
    0
  );

  const invoiceTotal = subtotal + vat;

  const credit = payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const balanceDue = Math.max(invoiceTotal - credit, 0);

  const clientName =
    job.client?.name || job.client_details?.name || "Customer";

  // Access VAT Number safely
  const clientVat = job.vat_number || job.client?.vat_number || null;

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-white py-10 print:py-0 text-black font-sans">
      {/* TOOLBAR */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <button
          onClick={() => router.push("/")}
          className="font-bold text-xs uppercase tracking-widest hover:underline"
        >
          ← Dashboard
        </button>
        <button
          onClick={() => window.print()}
          className="bg-black text-white px-8 py-3 rounded font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-gray-800 transition"
        >
          Download PDF
        </button>
      </div>

      {/* A4 PAGE */}
      <div className="max-w-[210mm] mx-auto min-h-[297mm] p-[15mm] border print:border-none flex flex-col bg-white shadow-2xl print:shadow-none">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-12 border-b-4 border-black pb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Logistics ERP
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-1">
              Freight & Forwarding Solutions
            </p>
            <p className="text-xs font-bold uppercase text-gray-500">
              Sultanate of Oman • Muscat
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-5xl font-black uppercase mb-2 tracking-tighter">
              Invoice
            </h2>
            <div className="border-2 border-black px-4 py-1 text-xs font-bold uppercase tracking-widest inline-block">
              {job.invoice_no || job.shipment_invoice_no || `INV-${job.id}`}
            </div>
          </div>
        </div>

        {/* CLIENT + JOB INFO */}
        <div className="grid grid-cols-2 gap-16 mb-12">
          <div>
            <p className="text-xs font-bold uppercase border-b-2 border-gray-200 mb-3 pb-1 text-gray-500">
              Bill To
            </p>
            <h3 className="text-xl font-black uppercase leading-none">
              {clientName}
            </h3>
            <p className="text-xs font-medium max-w-xs mt-2 text-gray-600 whitespace-pre-line">
              {job.client?.address ||
                job.client_details?.address ||
                "Registered Address on File"}
            </p>
            
            {/* --- VAT NUMBER DISPLAY --- */}
            {clientVat && (
                <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                    <span className="text-[10px] font-black uppercase text-gray-500">VAT NO</span>
                    <span className="text-sm font-bold font-mono text-black">{clientVat}</span>
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-4 text-sm content-start">
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-500">Issue Date</p>
              <p className="font-bold">
                {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-500">Job Reference</p>
              <p className="font-bold">#{job.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-500">Transport Mode</p>
              <p className="font-bold uppercase">
                {job.transport_mode || "SEA"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-500">Route</p>
              <p className="font-bold uppercase break-words">
                {job.port_loading} <span className="text-gray-400">→</span> {job.port_discharge}
              </p>
            </div>
          </div>
        </div>

        {/* LINE ITEMS */}
        <div className="flex-grow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 text-xs font-bold uppercase w-12 text-left">#</th>
                <th className="py-3 text-xs font-bold uppercase text-left">
                  Description of Services
                </th>
                <th className="py-3 text-xs font-bold uppercase text-right">
                  Amount (OMR)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="py-4 font-bold text-sm text-gray-500">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-4 text-sm font-bold uppercase pr-10">
                    {item.description}
                    <span className="block text-[10px] text-gray-400 font-normal normal-case">
                       {item.charge_type_name || "Service Charge"}
                    </span>
                  </td>
                  <td className="py-4 text-sm font-bold text-right tabular-nums">
                    {Number(item.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 3,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="mt-10 flex justify-end border-t-4 border-black pt-6">
          <div className="text-right space-y-2 w-64">
            <div className="flex justify-between gap-4 text-sm">
              <span className="font-bold uppercase text-gray-600">Subtotal</span>
              <span className="font-bold tabular-nums">
                {subtotal.toFixed(3)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="font-bold uppercase text-gray-600">VAT (5%)</span>
              <span className="font-bold tabular-nums">
                {vat.toFixed(3)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm border-t border-gray-300 pt-2 mt-2">
              <span className="font-black uppercase">Invoice Total</span>
              <span className="font-black tabular-nums">
                {invoiceTotal.toFixed(3)}
              </span>
            </div>

            {credit > 0 && (
                <div className="flex justify-between gap-4 text-sm text-gray-500">
                <span className="font-bold uppercase">
                    Paid / Credit
                </span>
                <span className="font-bold tabular-nums">
                    -{credit.toFixed(3)}
                </span>
                </div>
            )}

            <div className="border-t-2 border-black pt-3 mt-3 flex justify-between gap-4">
              <span className="font-black uppercase text-lg">
                Balance Due
              </span>
              <span className="font-black text-2xl tabular-nums">
                {balanceDue.toFixed(3)} <span className="text-xs align-top">OMR</span>
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-16 flex justify-between items-end border-t pt-6">
          <div className="max-w-xs">
            <p className="text-xs font-bold uppercase underline">
              Terms & Payment
            </p>
            <p className="text-[10px] font-medium leading-relaxed mt-2 text-gray-600">
              Settlement within 15 days of issue. Please quote Job Ref #{job.id} for
              bank transfers. This is a computer generated document and does not require a physical signature.
            </p>
          </div>

          <div className="text-right">
            <div className="w-48 h-[2px] bg-black mb-2 ml-auto"></div>
            <p className="text-xs font-bold uppercase">
              Authorized Signatory
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}