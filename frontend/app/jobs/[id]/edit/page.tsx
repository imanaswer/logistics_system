"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { API_URL } from '../../../config'; 

export default function EditJob() {
  const router = useRouter();
  const params = useParams();
  
  // Robust ID check
  const jobId = params?.jobId || params?.id; 

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    client_name: '', client_phone: '', client_email: '', client_address: '', vat_number: '', 
    transport_mode: 'SEA', job_date: '', port_loading: '', port_discharge: '',
    
    // --- SPLIT FIELDS ---
    invoice_no: '',
    supplier_ref: '',
    truck_details: '',

    no_of_packages: '0', gross_weight: '0', net_weight: '0', cbm: '0',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const truckOptions = [
      '1x20 ft dry', '1x40 ft dry', '1x20 ft reefer', '1x40 ft reefer', 
      '3 ton reefer', '3 ton normal', '10 ton reefer', '10 ton normal'
  ];

  // --- 1. FETCH & PARSE DATA ---
  useEffect(() => {
    if (!jobId) return;

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      
      try {
        const res = await axios.get(`${API_URL}/api/jobs/${jobId}/`, {
            headers: { Authorization: `Token ${token}` }
        });
        const data = res.data;
        
        // --- SMART PARSING LOGIC ---
        // 1. Get raw string
        let fullStr = data.shipment_invoice_no || '';
        
        // 2. Prefer dedicated Invoice field if available
        let inv = data.invoice_no || ''; 
        let ref = '';
        let trucks = '';

        // 3. Extract Trucks (Always in brackets at the end)
        if (fullStr.includes('(')) {
            const parts = fullStr.split('(');
            trucks = parts.slice(1).join('(').replace(/\)$/, ''); // Remove trailing )
            fullStr = parts[0].trim();
        } else if (fullStr.match(/(\d+x|ft|ton)/i)) {
            trucks = fullStr;
            fullStr = '';
        }

        // 4. Extract Invoice || Ref from the remaining string
        if (fullStr.includes('||')) {
            const parts = fullStr.split('||');
            // If dedicated invoice field was empty, assume first part is invoice
            if(!inv) inv = parts[0].trim();
            ref = parts[1].trim();
        } else {
            // If no separator, assume whatever is left is the Reference
            if(!inv && fullStr) ref = fullStr;
        }

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
          
          invoice_no: inv,
          supplier_ref: ref,
          truck_details: trucks,

          no_of_packages: data.no_of_packages?.toString() || '0',
          gross_weight: data.gross_weight?.toString() || '0',
          net_weight: data.net_weight?.toString() || '0',
          cbm: data.cbm?.toString() || '0',
        });
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching job:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  // --- HELPER: ADD TRUCK ---
  const addTruck = (truck: string) => {
      let current = formData.truck_details || "";
      // Simple append logic for clarity
      const cleanType = truck.replace('1x ', ''); 
      if (current.includes(cleanType)) {
          // If already exists, maybe try to be smart about counts, or just append
          // For simplicity/reliability in editing, we just append comma separated
          current += `, 1x ${cleanType}`;
      } else {
          current = current ? `${current}, 1x ${cleanType}` : `1x ${cleanType}`;
      }
      setFormData({ ...formData, truck_details: current });
  };

  // --- 2. HANDLE SAVE ---
  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');

    // Combine: "INV || REF (TRUCKS)"
    let truckPart = formData.truck_details ? ` (${formData.truck_details})` : '';
    const inv = formData.invoice_no.trim();
    const ref = formData.supplier_ref.trim();
    
    const finalString = `${inv} || ${ref}${truckPart}`;

    // --- PAYLOAD ---
    const payload = {
      vat_number: formData.vat_number, 
      invoice_no: inv,  // Save to dedicated column
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
      
      shipment_invoice_no: finalString, // Save composite string

      no_of_packages: parseFloat(formData.no_of_packages) || 0,
      gross_weight: parseFloat(formData.gross_weight) || 0,
      net_weight: parseFloat(formData.net_weight) || 0,
      cbm: parseFloat(formData.cbm) || 0,
    };

    try {
      await axios.put(`${API_URL}/api/jobs/${jobId}/`, payload, {
        headers: { Authorization: `Token ${token}` }
      });
      alert("✅ Job Updated Successfully!");
      router.push(`/jobs/${jobId}/view`);
    } catch (error: any) {
      console.error("Save failed", error);
      setSaving(false);

      if (error.response && error.response.data) {
          const serverErrors = error.response.data;
          // Check for specific field errors
          if (serverErrors.invoice_no) {
             alert(`❌ Error: Invoice Number is too long. Server limit is 100 (or you haven't migrated DB to 1000).`);
          } else if (serverErrors.shipment_invoice_no) {
             alert(`❌ Error: Combined text is too long.\n\nPLEASE RUN MIGRATIONS:\n1. python manage.py makemigrations\n2. python manage.py migrate`);
          } else {
             alert(`Server Error:\n${JSON.stringify(serverErrors, null, 2)}`);
          }
      } else {
          alert("Network Error: Could not reach server.");
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">LOADING...</div>;

  const sectionClass = "bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";
  const inputClass = "w-full p-3 rounded-lg border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition";

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center font-sans">
      <div className="w-full max-w-4xl space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Job Details</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Update customer info or shipment details.</p>
            </div>
            <button onClick={() => router.push("/")} className="text-slate-500 hover:text-red-600 font-bold text-sm bg-slate-100 hover:bg-red-50 px-4 py-2 rounded-lg transition">Cancel</button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
            
            {/* Customer Details */}
            <div className={sectionClass}>
                <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Customer Name</label><input type="text" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>VAT Number</label><input type="text" value={formData.vat_number} onChange={e => setFormData({...formData, vat_number: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Phone</label><input type="text" value={formData.client_phone} onChange={e => setFormData({...formData, client_phone: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Email</label><input type="email" value={formData.client_email} onChange={e => setFormData({...formData, client_email: e.target.value})} className={inputClass} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Address</label><textarea value={formData.client_address} onChange={e => setFormData({...formData, client_address: e.target.value})} className={inputClass} rows={2} /></div>
                </div>
            </div>

            {/* Shipment Details */}
            <div className={sectionClass}>
                <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Shipment Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Transport Mode</label>
                        <select value={formData.transport_mode} onChange={e => setFormData({...formData, transport_mode: e.target.value})} className={inputClass}>
                            <option value="SEA">Sea Freight</option>
                            <option value="AIR">Air Freight</option>
                            <option value="LAND">Land Freight</option>
                        </select>
                    </div>
                    <div><label className={labelClass}>Job Date</label><input type="date" value={formData.job_date} onChange={e => setFormData({...formData, job_date: e.target.value})} className={inputClass} /></div>

                    {/* TRUCK SELECTION */}
                    <div className="md:col-span-2 bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <label className={labelClass}>Add Container / Vehicle</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {truckOptions.map(t => (
                                <button key={t} type="button" onClick={() => addTruck(t)} className="bg-white border border-blue-200 text-blue-800 px-3 py-2 text-[10px] font-bold uppercase rounded-lg hover:bg-blue-600 hover:text-white transition shadow-sm">+ {t.replace('1x ', '')}</button>
                            ))}
                        </div>
                        <label className={labelClass}>Selected List (Editable)</label>
                        <input type="text" value={formData.truck_details} onChange={e => setFormData({...formData, truck_details: e.target.value})} className="w-full p-3 rounded-lg border border-blue-200 font-bold text-blue-900 bg-white focus:outline-none" />
                    </div>

                    <div><label className={labelClass}>Origin</label><input type="text" value={formData.port_loading} onChange={e => setFormData({...formData,port_loading: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Destination</label><input type="text" value={formData.port_discharge} onChange={e => setFormData({...formData, port_discharge: e.target.value})} className={inputClass} /></div>
                    
                    {/* SEPARATE FIELDS */}
                    <div>
                        <label className={labelClass}>Invoice Number</label>
                        <input type="text" value={formData.invoice_no} onChange={e => setFormData({...formData, invoice_no: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Supplier Reference</label>
                        <input type="text" value={formData.supplier_ref} onChange={e => setFormData({...formData, supplier_ref: e.target.value})} className={inputClass} />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div><label className={labelClass}>Packages</label><input type="number" value={formData.no_of_packages} onChange={e => setFormData({...formData, no_of_packages: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Gross Wt</label><input type="number" value={formData.gross_weight} onChange={e => setFormData({...formData, gross_weight: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Net Wt</label><input type="number" value={formData.net_weight} onChange={e => setFormData({...formData, net_weight: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Volume</label><input type="number" value={formData.cbm} onChange={e => setFormData({...formData, cbm: e.target.value})} className={inputClass} /></div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving} className="bg-slate-900 text-white font-bold py-4 px-12 rounded-xl shadow-lg hover:bg-black transition w-full md:w-auto">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </form>
      </div>
    </div>
  );
}