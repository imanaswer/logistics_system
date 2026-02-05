"use client";
import { useState, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function AIScanner() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // 1. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file)); // Show a preview of the receipt
      setResult(null); // Clear previous results
    }
  };

  // 2. Perform the Actual Scan
  const handleScan = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      return alert("Please select an image first!");
    }

    const formData = new FormData();
    formData.append('image', fileInputRef.current.files[0]);

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
        // IMPORTANT: Change this URL to your actual backend endpoint
        const res = await axios.post('http://127.0.0.1:8000/api/ai/scan/', formData, {
            headers: { 
                'Content-Type': 'multipart/form-data',
                'Authorization': `Token ${token}` 
            }
        });
        
        setResult(res.data);
    } catch (e: any) {
        console.error(e);
        // Fallback for demo purposes if backend isn't ready
        alert("Scan Failed. Ensure your Django view handles POST /api/ai/scan/ with an image.");
    } finally {
      setLoading(false);
    }
  };

  const saveExpense = async () => {
    if (!result) return;
    try {
        const token = localStorage.getItem('token');
        await axios.post('http://127.0.0.1:8000/api/transactions/', {
            trans_type: 'CP', // Cash Payment
            amount: result.amount,
            party_name: result.merchant,
            description: `AI Scanned Receipt - ${result.merchant}`,
            date: result.date || new Date().toISOString().split('T')[0]
        }, {
            headers: { 'Authorization': `Token ${token}` }
        });
        alert("Expense Saved Successfully!");
        router.push('/reports');
    } catch (error) {
        alert("Failed to save transaction. Check if all required fields are present.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center justify-center font-sans antialiased">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Neon Header Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400"></div>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <span className="text-3xl">👁️‍🗨️</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight italic">OCR SCANNER</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Automatic Expense Entry</p>
        </div>

        {/* Real File Input (Hidden) */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />

        {/* Upload Box */}
        <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer mb-6 overflow-hidden ${
                preview ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
            }`}
        >
            {preview ? (
                <img src={preview} alt="Receipt Preview" className="max-h-48 mx-auto rounded-lg shadow-lg" />
            ) : (
                <div className="py-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-tighter">Choose Receipt Image</p>
                </div>
            )}
        </div>

        {/* Action Button */}
        <button 
            onClick={handleScan}
            disabled={loading || !preview || !!result}
            className="w-full py-4 bg-white text-black font-black rounded-2xl shadow-xl transition active:scale-95 disabled:opacity-20 flex justify-center items-center gap-2 uppercase text-xs tracking-widest"
        >
            {loading ? 'Analyzing Pixels...' : result ? 'Scan Finished' : 'Begin AI Scan'}
        </button>

        {/* Results Area */}
        {result && (
            <div className="mt-8 space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-blue-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Extraction Results</p>
                </div>
                
                <div className="grid gap-3 bg-black/40 p-5 rounded-3xl border border-slate-800">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Merchant</span>
                        <span className="font-black text-sm">{result.merchant}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Date</span>
                        <span className="font-bold text-sm">{result.date}</span>
                    </div>
                    <div className="h-[1px] bg-slate-800 my-1"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-500 uppercase">Total Amount</span>
                        <span className="font-black text-xl text-blue-400">{Number(result.amount).toFixed(3)} OMR</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => {setResult(null); setPreview(null);}} className="flex-1 py-4 border border-slate-800 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-800 transition">Discard</button>
                    <button onClick={saveExpense} className="flex-[2] py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">Record Expense</button>
                </div>
            </div>
        )}
      </div>
      
      <button onClick={() => router.push("/")} className="mt-8 text-slate-600 hover:text-white transition text-[10px] font-bold uppercase tracking-widest">
        Exit Scanner
      </button>
    </div>
  );
}