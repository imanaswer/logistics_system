"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
// 1. Import the global config (Go up 2 levels to 'app')
import { API_URL } from '../../config'; 

export default function NewJob() {
  const router = useRouter();
  
  // --- FORM STATE ---
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [vatNumber, setVatNumber] = useState(''); 
  
  const [transportMode, setTransportMode] = useState('SEA');
  const [portLoading, setPortLoading] = useState('');
  const [portDischarge, setPortDischarge] = useState('');
  const [shipmentInvoiceNo, setShipmentInvoiceNo] = useState('');
  
  const [noOfPackages, setNoOfPackages] = useState<string>('');
  const [grossWeight, setGrossWeight] = useState<string>('');
  const [netWeight, setNetWeight] = useState<string>('');
  const [cbm, setCbm] = useState<string>('');
  
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/login';
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    if (!clientName.trim()) {
        alert("Client Name is required.");
        setLoading(false);
        return;
    }

    const pkg = parseFloat(noOfPackages) || 0;
    const gw = parseFloat(grossWeight) || 0;
    const nw = parseFloat(netWeight) || 0;
    const vol = parseFloat(cbm) || 0;

    const payload = {
      job_date: jobDate,
      vat_number: vatNumber, 
      client: {   
        name: clientName,
        phone: clientPhone || "N/A",
        email: clientEmail || null,
        address: clientAddress || "",
        vat_number: vatNumber 
      },
      transport_mode: transportMode,
      port_loading: portLoading,
      port_discharge: portDischarge,
      shipment_invoice_no: shipmentInvoiceNo,
      no_of_packages: pkg,
      gross_weight: gw,
      net_weight: nw,
      cbm: vol
    };

    try {
      // 2. Use API_URL here
      await axios.post(`${API_URL}/api/jobs/`, payload, {
          headers: { Authorization: `Token ${token}` }
      });

      alert("✅ Job Created Successfully!");
      router.push('/'); 

    } catch (error: any) {
      console.error("FULL ERROR:", error);
      setLoading(false);

      if (error.response) {
          const serverError = JSON.stringify(error.response.data, null, 2);
          alert(`Server Rejected Request:\n${serverError}`);
          
          if (error.response.status === 401) {
              window.location.href = '/login';
          }
      } else {
          alert("Network Error: Could not reach the server.");
      }
    }
  };

  const sectionClass = "bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";
  const inputClass = "w-full p-3 rounded-lg border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition";

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center font-sans">
      <div className="w-full max-w-4xl space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Job Card</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Enter shipment details to generate a job card.</p>
            </div>
            <button 
                onClick={() => router.push('/')} 
                className="text-slate-500 hover:text-red-600 font-bold text-sm bg-slate-100 hover:bg-red-50 px-4 py-2 rounded-lg transition"
            >
                Cancel
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className={sectionClass}>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Customer Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Customer Name <span className="text-red-500">*</span></label>
                        <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} className={inputClass} placeholder="Company or Person Name" />
                    </div>
                    <div>
                        <label className={labelClass}>VAT Number</label>
                        <input type="text" value={vatNumber} onChange={e => setVatNumber(e.target.value)} className={inputClass} placeholder="Ex: 123456789" />
                    </div>
                    <div>
                        <label className={labelClass}>Phone Number</label>
                        <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className={inputClass} placeholder="+968..." />
                    </div>
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className={inputClass} placeholder="client@example.com" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Full Address</label>
                        <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} className={inputClass} rows={2} placeholder="Building, Street, City..." />
                    </div>
                </div>
            </div>

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
                        <select value={transportMode} onChange={e => setTransportMode(e.target.value)} className={inputClass}>
                            <option value="SEA">Sea Freight</option>
                            <option value="AIR">Air Freight</option>
                            <option value="LAND">Land Freight</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Job Date</label>
                        <input type="date" required value={jobDate} onChange={e => setJobDate(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Port of Loading</label>
                        <input type="text" required value={portLoading} onChange={e => setPortLoading(e.target.value)} className={inputClass} placeholder="Ex: Jebel Ali" />
                    </div>
                    <div>
                        <label className={labelClass}>Port of Discharge</label>
                        <input type="text" required value={portDischarge} onChange={e => setPortDischarge(e.target.value)} className={inputClass} placeholder="Ex: Sohar Port" />
                    </div>
                    <div className="md:col-span-2">
                         <label className={labelClass}>Reference / Invoice No</label>
                         <input type="text" value={shipmentInvoiceNo} onChange={e => setShipmentInvoiceNo(e.target.value)} className={inputClass} placeholder="Will be auto-filled if blank" />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <label className={labelClass}>Packages</label>
                        <input type="number" value={noOfPackages} onChange={e => setNoOfPackages(e.target.value)} className={inputClass} placeholder="0" />
                    </div>
                    <div>
                        <label className={labelClass}>Gross Wt (KG)</label>
                        <input type="number" value={grossWeight} onChange={e => setGrossWeight(e.target.value)} className={inputClass} placeholder="0.0" />
                    </div>
                    <div>
                        <label className={labelClass}>Net Wt (KG)</label>
                        <input type="number" value={netWeight} onChange={e => setNetWeight(e.target.value)} className={inputClass} placeholder="0.0" />
                    </div>
                    <div>
                        <label className={labelClass}>Volume (CBM)</label>
                        <input type="number" value={cbm} onChange={e => setCbm(e.target.value)} className={inputClass} placeholder="0.0" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-slate-900 hover:bg-black text-white text-base font-bold py-4 px-12 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
                >
                    {loading ? 'Processing...' : 'Create Job Card'}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}