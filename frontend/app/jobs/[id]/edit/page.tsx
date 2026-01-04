"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';

export default function EditJobCustomer() {
  const router = useRouter();
  const params = useParams();
  
  // FIX: Check for both possible parameter names to prevent undefined errors
  const jobId = params.jobId || params.id; 

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_address: '',
    vat_number: '', 
    transport_mode: 'SEA',
    job_date: '',
    port_loading: '',
    port_discharge: '',
    shipment_invoice_no: '',
    no_of_packages: '0',
    gross_weight: '0',
    net_weight: '0',
    cbm: '0',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // --- 1. FETCH EXISTING DATA ---
  useEffect(() => {
    // Safety check: If no ID is found, stop loading and show error
    if (!jobId) {
        setLoading(false);
        setError("Invalid URL: Job ID missing.");
        return;
    }

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      
      try {
        console.log("Fetching data for Job ID:", jobId); 
        
        // 👇 CHANGE THIS LINE (Add ?t=${Date.now()})
        const res = await axios.get(`http://127.0.0.1:8000/api/jobs/${jobId}/?t=${Date.now()}`, {
            headers: { Authorization: `Token ${token}` }
        });
        
        const data = res.data;

        // Populate state
        setFormData({
          client_name: data.client_details?.name || data.client?.name || '',
          client_phone: data.client_details?.phone || data.client?.phone || '',
          client_email: data.client_details?.email || data.client?.email || '',
          client_address: data.client_details?.address || data.client?.address || '',
          vat_number: data.vat_number || '', 
          transport_mode: data.transport_mode || 'SEA',
          job_date: data.job_date || '',
          port_loading: data.port_loading || '',
          port_discharge: data.port_discharge || '',
          shipment_invoice_no: data.shipment_invoice_no || '',
          no_of_packages: data.no_of_packages?.toString() || '0',
          gross_weight: data.gross_weight?.toString() || '0',
          net_weight: data.net_weight?.toString() || '0',
          cbm: data.cbm?.toString() || '0',
        });
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching job:", error);
        setError("Failed to load job details. Check console.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [jobId]);

  // --- 2. HANDLE SAVE ---
  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');

    const payload = {
      vat_number: formData.vat_number, 
      client: {
        name: formData.client_name,
        phone: formData.client_phone,
        email: formData.client_email,
        address: formData.client_address,
        vat_number: formData.vat_number 
      },
      transport_mode: formData.transport_mode,
      job_date: formData.job_date,
      port_loading: formData.port_loading,
      port_discharge: formData.port_discharge,
      shipment_invoice_no: formData.shipment_invoice_no,
      no_of_packages: parseFloat(formData.no_of_packages) || 0,
      gross_weight: parseFloat(formData.gross_weight) || 0,
      net_weight: parseFloat(formData.net_weight) || 0,
      cbm: parseFloat(formData.cbm) || 0,
    };

    try {
      await axios.put(`http://127.0.0.1:8000/api/jobs/${jobId}/`, payload, {
        headers: { Authorization: `Token ${token}` }
      });
      alert("✅ Job Details Updated!");
      router.push(`/jobs/${jobId}/view`);
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save changes.");
      setSaving(false);
    }
  };

  // --- RENDER STATES ---
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">Loading Editor...</div>;
  
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 font-bold uppercase tracking-widest">{error}</div>
        <button onClick={() => router.back()} className="bg-slate-900 text-white px-6 py-2 rounded-lg">Go Back</button>
    </div>
  );

  // --- FORM UI ---
  const sectionClass = "bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";
  const inputClass = "w-full p-3 rounded-lg border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition";

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center font-sans">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Job Details</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Update customer info or shipment details.</p>
            </div>
            <button onClick={() => router.back()} className="text-slate-500 hover:text-red-600 font-bold text-sm bg-slate-100 hover:bg-red-50 px-4 py-2 rounded-lg transition">Cancel</button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
            
            {/* Customer Details */}
            <div className={sectionClass}>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Customer Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Customer Name</label>
                        <input type="text" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>VAT Number</label>
                        <input type="text" value={formData.vat_number} onChange={e => setFormData({...formData, vat_number: e.target.value})} className={inputClass} placeholder="TRN / VAT NO" />
                    </div>
                    <div>
                        <label className={labelClass}>Phone</label>
                        <input type="text" value={formData.client_phone} onChange={e => setFormData({...formData, client_phone: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Email</label>
                        <input type="email" value={formData.client_email} onChange={e => setFormData({...formData, client_email: e.target.value})} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Full Address</label>
                        <textarea value={formData.client_address} onChange={e => setFormData({...formData, client_address: e.target.value})} className={inputClass} rows={2} />
                    </div>
                </div>
            </div>

            {/* Shipment Details */}
            <div className={sectionClass}>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Shipment Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Transport Mode</label>
                        <select value={formData.transport_mode} onChange={e => setFormData({...formData, transport_mode: e.target.value})} className={inputClass}>
                            <option value="SEA">Sea Freight</option>
                            <option value="AIR">Air Freight</option>
                            <option value="LAND">Land Freight</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Job Date</label>
                        <input type="date" value={formData.job_date} onChange={e => setFormData({...formData, job_date: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Port of Loading</label>
                        <input type="text" value={formData.port_loading} onChange={e => setFormData({...formData, port_loading: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Port of Discharge</label>
                        <input type="text" value={formData.port_discharge} onChange={e => setFormData({...formData, port_discharge: e.target.value})} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Reference No</label>
                        <input type="text" value={formData.shipment_invoice_no} onChange={e => setFormData({...formData, shipment_invoice_no: e.target.value})} className={inputClass} />
                    </div>
                </div>

                {/* Cargo Stats */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <label className={labelClass}>Packages</label>
                        <input type="number" value={formData.no_of_packages} onChange={e => setFormData({...formData, no_of_packages: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Gross Wt (KG)</label>
                        <input type="number" value={formData.gross_weight} onChange={e => setFormData({...formData, gross_weight: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Net Wt (KG)</label>
                        <input type="number" value={formData.net_weight} onChange={e => setFormData({...formData, net_weight: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Volume (CBM)</label>
                        <input type="number" value={formData.cbm} onChange={e => setFormData({...formData, cbm: e.target.value})} className={inputClass} />
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving} className="bg-slate-900 text-white font-bold py-4 px-12 rounded-xl shadow-lg hover:bg-black transition w-full md:w-auto">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}