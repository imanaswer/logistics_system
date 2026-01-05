"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
// 1. Import the global config
import { API_URL } from '../../../config'; 

export default function EditJob() {
  const router = useRouter();
  const params = useParams(); 
  const jobId = params.id;

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    transport_mode: '',
    port_loading: '',
    port_discharge: '',
    shipment_invoice_no: '',
    is_finished: false,
    // New Fields
    no_of_packages: '',
    gross_weight: '',
    net_weight: '',
    client_name: '', // Read-only display
  });

  // 1. Fetch Existing Data
  useEffect(() => {
    const fetchJob = async () => {
      try {
        // IMPROVEMENT: Added timestamp (?t=...) to prevent caching old data
        const res = await axios.get(`${API_URL}/api/jobs/${jobId}/?t=${Date.now()}`);
        const job = res.data;
        
        setFormData({
          transport_mode: job.transport_mode,
          port_loading: job.port_loading,
          port_discharge: job.port_discharge,
          shipment_invoice_no: job.shipment_invoice_no,
          is_finished: job.is_finished,
          no_of_packages: job.no_of_packages,
          gross_weight: job.gross_weight,
          net_weight: job.net_weight,
          client_name: job.client_details?.name || 'Unknown' 
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching job:", error);
        router.push('/');
      }
    };

    if (jobId) fetchJob();
  }, [jobId, router]);

  // 2. Handle Input Changes
  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // 3. Submit Updates
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      // Use API_URL for the update
      await axios.patch(`${API_URL}/api/jobs/${jobId}/`, {
        transport_mode: formData.transport_mode,
        port_loading: formData.port_loading,
        port_discharge: formData.port_discharge,
        shipment_invoice_no: formData.shipment_invoice_no,
        is_finished: formData.is_finished,
        no_of_packages: formData.no_of_packages,
        gross_weight: formData.gross_weight,
        net_weight: formData.net_weight,
      });

      router.push(`/jobs/${jobId}/view`); // Go to View page after save
    } catch (error) {
      console.error("Error updating job:", error);
      alert("Failed to update job.");
    }
  };

  if (loading) return <div className="p-10 text-gray-500">Loading job details...</div>;

  // Reusable Styles (Consistent with Create Page)
  const inputStyle = "w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelStyle = "block text-xs font-bold text-gray-600 uppercase mb-1 tracking-wide";

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center font-sans">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Job #{jobId}</h2>
          <span className="text-sm font-semibold text-blue-800 bg-blue-100 px-4 py-2 rounded-full">
            Customer: {formData.client_name}
          </span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* --- Section 1: Job Status --- */}
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-yellow-900">Job Status</h3>
              <p className="text-sm text-yellow-700">Toggle this when the shipment is delivered and invoiced.</p>
            </div>
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-yellow-200">
                <input 
                type="checkbox" 
                name="is_finished" 
                checked={formData.is_finished} 
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-gray-900 font-bold text-sm">Mark as Completed</label>
            </div>
          </div>

          {/* --- Section 2: Shipment Details --- */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
              Shipment Routing
            </h3>
            <div className="grid grid-cols-2 gap-6">
              
              <div>
                <label className={labelStyle}>Transport Mode</label>
                <select 
                  name="transport_mode" 
                  value={formData.transport_mode} 
                  onChange={handleChange} 
                  className={inputStyle}
                >
                  <option value="SEA">Sea Freight</option>
                  <option value="AIR">Air Freight</option>
                  <option value="LAND">Land Transport</option>
                </select>
              </div>

              <div>
                <label className={labelStyle}>Invoice No</label>
                <input 
                  name="shipment_invoice_no" 
                  value={formData.shipment_invoice_no} 
                  onChange={handleChange} 
                  placeholder="Invoice No" 
                  className={inputStyle} 
                />
              </div>

              <div>
                <label className={labelStyle}>Port of Loading</label>
                <input 
                  name="port_loading" 
                  value={formData.port_loading} 
                  onChange={handleChange} 
                  className={inputStyle} 
                  required 
                />
              </div>

              <div>
                <label className={labelStyle}>Port of Discharge</label>
                <input 
                  name="port_discharge" 
                  value={formData.port_discharge} 
                  onChange={handleChange} 
                  className={inputStyle} 
                  required 
                />
              </div>
            </div>
          </div>

           {/* --- Section 3: Cargo Details (NEW) --- */}
           <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <h3 className="font-bold text-green-900 mb-4 flex items-center">
              <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
              Cargo Weight & Packages
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className={labelStyle}>No. of Packages</label>
                <input 
                  type="number" 
                  name="no_of_packages" 
                  value={formData.no_of_packages}
                  onChange={handleChange} 
                  className={inputStyle} 
                />
              </div>
              <div>
                <label className={labelStyle}>Gross Weight (KG)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  name="gross_weight" 
                  value={formData.gross_weight}
                  onChange={handleChange} 
                  className={inputStyle} 
                />
              </div>
              <div>
                <label className={labelStyle}>Net Weight (KG)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  name="net_weight" 
                  value={formData.net_weight}
                  onChange={handleChange} 
                  className={inputStyle} 
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => router.back()}
              className="w-1/3 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="w-2/3 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}