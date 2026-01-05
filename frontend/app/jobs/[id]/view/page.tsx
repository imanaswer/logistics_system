"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '../../../config';

export default function ViewJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId || params.id; 

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasInvoice, setHasInvoice] = useState(false);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const config = { headers: { Authorization: `Token ${token}` } };

      try {
        const res = await axios.get(`${API_URL}/api/jobs/${jobId}/?t=${Date.now()}`, config);
        setJob(res.data);

        const invRes = await axios.get(`${API_URL}/api/invoice-items/?job=${jobId}&t=${Date.now()}`, config);
        if (invRes.data.length > 0) setHasInvoice(true);

        setLoading(false);
      } catch (error: any) {
        if (error.response && error.response.status === 401) window.location.href = '/login';
        setLoading(false);
      }
    };
    if (jobId) fetchData();
  }, [jobId]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 tracking-widest uppercase">Loading Job...</div>;
  if (!job) return <div className="p-10 text-center text-red-600 font-bold uppercase">Job not found</div>;

  // --- 2. SMART DATA PARSING (The Fix) ---
  const clientName = job.client_details?.name || job.client?.name || "Unknown Client";
  const clientPhone = job.client_details?.phone || job.client?.phone || "-";
  const clientEmail = job.client_details?.email || job.client?.email || "-";
  const clientAddress = job.client_details?.address || job.client?.address || "";
  const vatNumber = job.vat_number || "Not Provided"; 

  // Logic: Separate "Ref No" from "Truck List"
  let fullRef = job.shipment_invoice_no || '';
  let displayRef = 'N/A';
  let truckDetails = null;

  if (fullRef.includes('(') && fullRef.includes(')')) {
    // Format: "REF-123 (1x 20ft...)"
    const parts = fullRef.split('(');
    displayRef = parts[0].trim();
    truckDetails = parts[1].replace(')', '').trim();
  } 
  else if (fullRef.toLowerCase().includes('ft') || fullRef.toLowerCase().includes('ton') || fullRef.toLowerCase().includes('x')) {
    // Format: "1x 20ft dry..." (Only trucks, no ref)
    truckDetails = fullRef;
    displayRef = '-';
  } 
  else {
    // Format: "REF-123" (Only ref, no trucks)
    displayRef = fullRef || 'N/A';
  }

  // --- 3. Handlers ---
  const handleWhatsApp = () => {
    const cleanPhone = clientPhone.replace(/[^0-9]/g, ''); 
    const message = `Hello ${clientName},\n\nUpdate regarding Job #${job.id}.\nRef: ${displayRef}\nStatus: ${job.is_finished ? 'Completed' : 'In Progress'}`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = () => {
      const subject = `Update: Job #${job.id}`;
      window.open(`mailto:${clientEmail}?subject=${encodeURIComponent(subject)}`);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to DELETE this Job?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/jobs/${jobId}/`, { headers: { Authorization: `Token ${token}` } });
        router.push('/'); 
      } catch (error) { alert("Failed to delete."); }
    }
  };

  const sectionTitle = "text-xs font-black text-slate-400 uppercase tracking-widest mb-4";
  const label = "text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wide"; 

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex justify-center font-sans">
      
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl">
                    {job.transport_mode === 'AIR' ? '✈' : job.transport_mode === 'SEA' ? '⚓' : '🚛'}
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">JOB #{job.id}</h1>
                    <p className="text-slate-400 text-xs font-bold mt-1">Created: {job.job_date}</p>
                </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center justify-center">
             <button onClick={handleWhatsApp} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs transition shadow-lg flex items-center gap-2">WhatsApp</button>
             <button onClick={handleEmail} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs transition shadow-lg">Email</button>
             <div className="w-px h-8 bg-slate-700 mx-2"></div>
            {hasInvoice ? (
                <Link href={`/invoices/${job.id}/view`}><button className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-lg text-xs font-bold transition shadow-lg">View Invoice</button></Link>
            ) : (
                <Link href={`/invoices/${job.id}`}><button className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg text-xs font-bold transition shadow-lg">Generate Invoice</button></Link>
            )}
            <Link href={`/jobs/${job.id}/edit`}><button className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-xs font-bold transition border border-slate-600">Edit Job</button></Link>
            <button onClick={() => router.push('/')} className="bg-white text-slate-900 px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition">Close</button>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div className="space-y-8">
            {/* Customer Info */}
            <div>
              <h3 className={sectionTitle}>Customer Information</h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  <div className="flex-grow">
                      <p className={label}>Client Name</p>
                      <p className="text-xl font-black text-slate-900 mb-4">{clientName}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div><p className={label}>Phone</p><p className="text-slate-900 font-bold text-sm">{clientPhone}</p></div>
                          <div><p className={label}>VAT Number</p><p className="text-amber-600 font-black text-sm uppercase">{vatNumber}</p></div>
                          <div className="col-span-2"><p className={label}>Address</p><p className="text-slate-700 text-sm font-medium whitespace-pre-line">{clientAddress}</p></div>
                      </div>
                  </div>
              </div>
            </div>

            {/* Cargo Stats */}
            <div>
              <h3 className={sectionTitle}>Cargo Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Packages</p>
                  <p className="text-2xl font-black text-emerald-900">{job.no_of_packages}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Gross Wt</p>
                  <p className="text-xl font-black text-emerald-900">{job.gross_weight} <span className="text-[10px]">KG</span></p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Volume</p>
                  <p className="text-xl font-black text-emerald-900">{job.cbm} <span className="text-[10px]">CBM</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Routing */}
            <div>
              <h3 className={sectionTitle}>Shipment Routing</h3>
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 space-y-6 relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wide ${job.transport_mode === 'SEA' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{job.transport_mode} FREIGHT</span>
                    <div className="text-right">
                        <p className={label}>Reference No</p>
                        <p className="text-slate-900 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-sm">{displayRef}</p>
                    </div>
                </div>
                
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-8 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                    <p className={label}>Port of Loading</p>
                    <p className="text-xl font-black text-slate-900">{job.port_loading}</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-sm"></div>
                    <p className={label}>Port of Discharge</p>
                    <p className="text-xl font-black text-slate-900">{job.port_discharge}</p>
                  </div>
                </div>

                {/* --- TRUCK DETAILS BLUE BOX --- */}
                {truckDetails && (
                    <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <div className="mt-1 text-blue-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Container / Vehicle Manifest</p>
                            <p className="text-sm font-bold text-blue-900">{truckDetails}</p>
                        </div>
                    </div>
                )}
              </div>
            </div>
            
            <button onClick={handleDelete} className="w-full text-red-400 hover:text-red-600 hover:bg-red-50 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition flex justify-center items-center gap-2">
               Delete Job Permanently
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}