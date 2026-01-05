"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
// 1. Import the global config
import { API_URL } from '../../../config'; 
export default function ViewJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId || params.id; 

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasInvoice, setHasInvoice] = useState(false);

  // --- 1. Fetch Data (SECURELY) ---
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
          window.location.href = '/login';
          return;
      }
      const config = { headers: { Authorization: `Token ${token}` } };

      try {
        // FIX: Use API_URL here
        const res = await axios.get(`${API_URL}/api/jobs/${jobId}/?t=${Date.now()}`, config);
        setJob(res.data);

        // Check for invoice items to decide button state (Using API_URL)
        const invRes = await axios.get(`${API_URL}/api/invoice-items/?job=${jobId}&t=${Date.now()}`, config);
        if (invRes.data.length > 0) setHasInvoice(true);

        setLoading(false);
      } catch (error: any) {
        console.error(error);
        if (error.response && error.response.status === 401) {
            window.location.href = '/login';
        }
        setLoading(false);
      }
    };
    if (jobId) fetchData();
  }, [jobId]);

  if (loading) return <div className="p-10 text-center text-slate-800 font-bold tracking-widest uppercase italic">Loading...</div>;
  if (!job) return <div className="p-10 text-center text-red-600 font-bold uppercase">Job not found</div>;

  // --- SAFE DATA ACCESSORS ---
  const clientName = job.client_details?.name || job.client?.name || "Unknown Client";
  const clientPhone = job.client_details?.phone || job.client?.phone || "-";
  const clientEmail = job.client_details?.email || job.client?.email || "-";
  const clientAddress = job.client_details?.address || job.client?.address || "";
  // Access the VAT number from the job object
  const vatNumber = job.vat_number || "Not Provided"; 

  // 2. Communication Handlers (MAINTAINED)
  const handleWhatsApp = () => {
    const cleanPhone = clientPhone.replace(/[^0-9]/g, ''); 
    const message = `Hello ${clientName},\n\nUpdate regarding Job #${job.id} (${job.transport_mode}).\nRoute: ${job.port_loading} to ${job.port_discharge}.\nStatus: ${job.is_finished ? 'Completed' : 'In Progress'}`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = () => {
      const subject = `Update: Job #${job.id} - ${job.transport_mode}`;
      const body = `Dear ${clientName},\n\nHere is an update regarding your shipment.\n\nJob ID: #${job.id}\nMode: ${job.transport_mode}\nRoute: ${job.port_loading} -> ${job.port_discharge}\n\nRegards,\nLogistics Team`;
      window.open(`mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to DELETE this Job? This cannot be undone.")) {
      try {
        const token = localStorage.getItem('token');
        // FIX: Use API_URL here
        await axios.delete(`${API_URL}/api/jobs/${jobId}/`, {
            headers: { Authorization: `Token ${token}` }
        });
        alert("Job deleted.");
        router.push('/'); 
      } catch (error) { alert("Failed to delete."); }
    }
  };

  // --- HIGH CONTRAST STYLES ---
  const sectionTitle = "text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 border-b-2 border-slate-200 pb-2";
  const label = "text-xs text-slate-700 uppercase font-extrabold mb-1 tracking-wide"; 
  
  return (
    <div className="min-h-screen bg-slate-100 p-8 flex justify-center font-sans">
      
      {/* Back Button */}
      <button 
        onClick={() => router.push('/')} 
        className="fixed top-6 right-6 bg-white text-slate-700 hover:text-red-600 p-3 rounded-full shadow-lg hover:shadow-xl transition z-50 group border border-slate-200"
        title="Back to Dashboard"
      >
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* HEADER - Updated to show Auto-generated Invoice ID */}
        <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 border-b-8 border-amber-500">
          <div>
            <div className="flex items-center gap-3">
                {/* Primary display is now the unique Invoice No */}
                <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase italic">
                  {job.invoice_no || `Job #${job.id}`}
                </h1>
                {!job.is_finished && <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Active</span>}
            </div>
            <p className="text-slate-300 mt-2 text-sm font-medium">System ID: {job.id} • Date Created: {job.job_date}</p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center justify-center">
             
             <button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                WhatsApp
             </button>

             <button onClick={handleEmail} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition shadow-lg" title="Email">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
             </button>

             <div className="w-px h-8 bg-slate-700 mx-2"></div>

            {hasInvoice ? (
                <Link href={`/invoices/${job.id}/view`}>
                    <button className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-lg">View Invoice</button>
                </Link>
            ) : (
                <Link href={`/invoices/${job.id}`}>
                    <button className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-lg">Generate Invoice</button>
                </Link>
            )}
            
            <Link href={`/invoices/${job.id}/edit`}>
              <button className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition border border-slate-600">
                Edit Invoice
              </button>
            </Link>

            <button onClick={() => router.push('/')} className="bg-white text-slate-900 px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition">
              Close
            </button>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div className="space-y-8">
            {/* Client Info with VAT Number integration */}
            <div>
              <h3 className={sectionTitle}>Customer Information</h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-start gap-5">
                    <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <div className="flex-grow">
                        <p className={label}>Client Name</p>
                        <p className="text-2xl font-extrabold text-slate-900">{clientName}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                            <div>
                                <p className={label}>Phone</p>
                                <p className="text-slate-900 font-bold text-lg">{clientPhone}</p>
                            </div>
                            {/* Added VAT Number display here */}
                            <div>
                                <p className={label}>VAT Number</p>
                                <p className="text-amber-700 font-black text-lg tracking-tight uppercase">
                                  {vatNumber}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className={label}>Email</p>
                                <p className="text-slate-900 font-bold text-lg">{clientEmail}</p>
                            </div>
                        </div>
                        {clientAddress && (
                            <div className="mt-5 pt-4 border-t border-slate-200">
                                <p className={label}>Address</p>
                                <p className="text-slate-800 text-sm font-medium whitespace-pre-line leading-relaxed">{clientAddress}</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>

            {/* Cargo */}
            <div>
              <h3 className={sectionTitle}>Cargo Summary</h3>
              <div className="grid grid-cols-3 gap-0 bg-emerald-50 rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
                <div className="text-center p-5 border-r border-emerald-200">
                  <p className="text-xs text-emerald-800 font-bold uppercase mb-1">Packages</p>
                  <p className="text-3xl font-extrabold text-emerald-900">{job.no_of_packages}</p>
                </div>
                <div className="text-center p-5 border-r border-emerald-200">
                  <p className="text-xs text-emerald-800 font-bold uppercase mb-1 text-">Gross Wt</p>
                  <p className="text-2xl font-bold text-emerald-900">{job.gross_weight} <span className="text-sm font-medium uppercase">KG</span></p>
                </div>
                <div className="text-center p-5">
                  <p className="text-xs text-emerald-800 font-bold uppercase mb-1">Net Wt</p>
                  <p className="text-2xl font-bold text-emerald-900">{job.net_weight} <span className="text-sm font-medium uppercase">KG</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Routing */}
            <div>
              <h3 className={sectionTitle}>Shipment Routing</h3>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className={`px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide ${job.transport_mode === 'SEA' ? 'bg-blue-100 text-blue-800' : job.transport_mode === 'AIR' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>{job.transport_mode} FREIGHT</span>
                    <div className="text-right">
                        <p className={label}>Reference No</p>
                        <p className="text-slate-900 font-mono font-bold bg-slate-100 px-3 py-1 rounded text-sm">{job.shipment_invoice_no || 'N/A'}</p>
                    </div>
                </div>
                <div className="relative border-l-4 border-slate-200 ml-4 pl-8 space-y-12 py-4">
                  <div className="relative">
                    <span className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-md"></span>
                    <p className={label}>Port of Loading</p>
                    <p className="text-2xl font-bold text-slate-900 leading-">{job.port_loading}</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-slate-800 border-4 border-white shadow-md"></span>
                    <p className={label}>Port of Discharge</p>
                    <p className="text-2xl font-bold text-slate-900 leading-">{job.port_discharge}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons: Split Edit into specialized options */}
            <div className="flex flex-col gap-4">
                <Link href={`/jobs/${job.id}/edit`}>
                  <button className="w-full bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition border border-transparent">
                    Edit Customer Details
                  </button>
                </Link>
                
                <button onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-6 py-3 rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 border border-transparent hover:border-red-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Delete Job Permanently
                </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}