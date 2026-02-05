"use client";
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
// 1. Import the global config
import { API_URL } from '../config'; 

export default function Reports() {
  const router = useRouter();

  // --- HELPERS ---
  const getFirstDayOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const getToday = () => new Date().toISOString().split('T')[0];

  // --- STATE ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [jobMap, setJobMap] = useState<{[key: number]: string}>({});
  const [clients, setClients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [startDate, setStartDate] = useState(getFirstDayOfMonth()); 
  const [endDate, setEndDate] = useState(getToday());
  const [loading, setLoading] = useState(true);

  // --- DATA LOADING ---
  useEffect(() => {
    const init = async () => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }

        try {
            // FIX: Use API_URL here
            const [jobsRes, transRes] = await Promise.all([
                axios.get(`${API_URL}/api/jobs/`, { headers: { Authorization: `Token ${token}` } }),
                axios.get(`${API_URL}/api/transactions/`, { headers: { Authorization: `Token ${token}` } })
            ]);
            
            const map: {[key: number]: string} = {};
            jobsRes.data.forEach((j: any) => {
                map[j.id] = j.client_details?.name || j.client?.name || "Unknown";
            });
            setJobMap(map);

            // Sort transactions by date ascending for balance calculation
            const sortedData = transRes.data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setTransactions(sortedData);

            const rawNames = [...sortedData.map((t: any) => t.party_name), ...Object.values(map)];
            const cleanNames = Array.from(new Set(rawNames.map(n => n?.toUpperCase().trim()))).sort();
            setClients(cleanNames);

        } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    init();
  }, []);

  // --- FILTER & BALANCE LOGIC ---
  // We use useMemo to calculate running balance only when filters change
  const reportData = useMemo(() => {
    let runningBalance = 0;
    let result = transactions;

    if (selectedClient !== 'ALL') {
        const term = selectedClient.toLowerCase();
        result = result.filter(t => (t.party_name || "").toLowerCase().includes(term) || (jobMap[t.job] || "").toLowerCase().includes(term));
    }
    if (startDate) result = result.filter(t => t.date >= startDate);
    if (endDate) result = result.filter(t => t.date <= endDate);

    return result.map(t => {
        const isReceived = ['CR', 'BR'].includes(t.trans_type);
        const amount = Number(t.amount);
        if (isReceived) runningBalance += amount;
        else runningBalance -= amount;

        return {
            ...t,
            received: isReceived ? amount : 0,
            paid: !isReceived ? amount : 0,
            currentBalance: runningBalance
        };
    });
  }, [selectedClient, startDate, endDate, transactions, jobMap]);

  const totalReceived = reportData.reduce((sum, t) => sum + t.received, 0);
  const totalPaid = reportData.reduce((sum, t) => sum + t.paid, 0);
  const netBalance = totalReceived - totalPaid;

  if (loading) return <div className="p-10 font-black text-center text-slate-400">LOADING REPORTS...</div>;

  return (
    <div className="min-h-screen p-8 bg-slate-50 font-sans text-slate-900">
        
        <div className="flex items-center justify-between max-w-6xl mx-auto mb-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Ledger Statement</h1>
                <p className="font-medium text-slate-500">Real-time running balance and cash flow.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => router.push('/reports/ledger')} 
                    className="px-4 py-2 text-xs font-bold transition bg-blue-600 text-white border rounded-lg shadow-sm hover:bg-blue-700"
                    data-testid="professional-ledger-button"
                >
                    📊 Professional Ledger
                </button>
                <button onClick={() => router.push('/')} className="px-4 py-2 text-xs font-bold transition bg-white border rounded-lg shadow-sm border-slate-300 text-slate-700 hover:bg-slate-50">
                    ← Dashboard
                </button>
            </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
            
            {/* FILTER BAR */}
            <div className="flex flex-col items-end gap-4 p-5 border bg-white rounded-2xl shadow-sm border-slate-200 md:flex-row">
                <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Party Name</label>
                    <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-bold text-slate-800 bg-slate-50 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500 appearance-none">
                        <option value="ALL">All Clients / Parties</option>
                        {clients.map((client, index) => <option key={index} value={client}>{client}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-40">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-bold text-slate-800 bg-slate-50 outline-none" />
                </div>
                <div className="w-full md:w-40">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-bold text-slate-800 bg-slate-50 outline-none" />
                </div>
            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="relative flex items-center justify-between p-6 overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500"></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Received</p><p className="text-3xl font-black text-slate-900">{totalReceived.toFixed(3)}</p></div>
                </div>
                <div className="relative flex items-center justify-between p-6 overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500"></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Paid</p><p className="text-3xl font-black text-slate-900">{totalPaid.toFixed(3)}</p></div>
                </div>
                <div className="relative flex items-center justify-between p-6 overflow-hidden text-white shadow-lg bg-slate-900 rounded-2xl">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Cash Position</p><p className="text-3xl font-black">{netBalance.toFixed(3)}</p></div>
                </div>
            </div>

            {/* TABLE */}
            <div className="overflow-hidden border bg-white rounded-2xl shadow-sm border-slate-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Party & Job Info</th>
                            <th className="p-4">Client Name</th>
                            <th className="p-4">Description</th>
                            <th className="p-4 text-right">Received (+)</th>
                            <th className="p-4 text-right text-red-500">Paid (-)</th>
                            <th className="p-4 text-right bg-slate-100 text-slate-900">Running Balance</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium divide-y divide-slate-100 text-slate-700">
                        {reportData.length === 0 ? (
                            <tr><td colSpan={7} className="p-10 text-center text-slate-400">No transactions match your filters.</td></tr>
                        ) : (
                            reportData.map((t) => (
                                <tr key={t.id} className="transition hover:bg-slate-50/80">
                                    <td className="p-4 font-bold whitespace-nowrap">{t.date}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{t.party_name}</div>
                                        {t.job && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">JOB #{t.job}</span>}
                                    </td>
                                    <td className="p-4 font-bold text-slate-900">{t.client_name || '-'}</td>
                                    <td className="p-4 text-xs text-slate-500 max-w-xs">{t.description || '-'}</td>
                                    
                                    {/* Received Column */}
                                    <td className="p-4 font-bold text-right text-green-600">
                                        {t.received > 0 ? t.received.toFixed(3) : '-'}
                                    </td>
                                    
                                    {/* Paid Column */}
                                    <td className="p-4 font-bold text-right text-red-600">
                                        {t.paid > 0 ? t.paid.toFixed(3) : '-'}
                                    </td>
                                    
                                    {/* Balance Column */}
                                    <td className={`p-4 text-right font-black bg-slate-50/50 ${t.currentBalance >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                                        {t.currentBalance.toFixed(3)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    </div>
  );
}