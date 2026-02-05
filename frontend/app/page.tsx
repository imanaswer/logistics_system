"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from 'recharts';
import { API_URL } from './config';

// --- INTERFACES ---
interface Job {
  id: number;
  job_date: string;
  client?: { name: string; phone: string }; 
  client_details?: { name: string; phone: string };
  transport_mode: string;
  port_loading: string;
  port_discharge: string;
}

interface Transaction {
  id: number;
  trans_type: string;
  amount: number;
  date: string;
}

interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  timestamp: string;
}

export default function Dashboard() {
  const router = useRouter();
  
  // --- STATE ---
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("User");
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Optimized for dashboard view height

  // Audit Filters
  const [showAuditFilter, setShowAuditFilter] = useState(false);
  const [auditUserFilter, setAuditUserFilter] = useState('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    if (!token) { window.location.href = '/login'; return; }
    if (user) setCurrentUser(user);
    fetchData(token);

    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const config = { headers: { Authorization: `Token ${token}` } };
      const [jobsRes, transRes, auditRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs/`, config),
        axios.get(`${API_URL}/api/transactions/`, config),
        axios.get(`${API_URL}/api/audit-logs/`, config)
      ]);
      setJobs(jobsRes.data);
      setTransactions(transRes.data);
      setAuditLogs(auditRes.data);
      setLoading(false);
    } catch (error: any) { 
        if (error.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
    }
  };

  const handleLogout = () => { if(confirm("Sign out?")) { localStorage.clear(); window.location.href = '/login'; } };

  const handleDeleteJob = async (id: number) => {
    if (!confirm("Are you sure? This will delete the Job and its Invoice.")) return;
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/jobs/${id}/`, { headers: { Authorization: `Token ${token}` } });
        setJobs(jobs.filter(job => job.id !== id));
    } catch (error) { alert("Delete failed."); }
  };

  // --- CALCULATIONS & PAGINATION LOGIC ---
  const totalReceived = transactions.filter(t => ['CR', 'BR'].includes(t.trans_type)).reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPaid = transactions.filter(t => ['CP', 'BP'].includes(t.trans_type)).reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalReceived - totalPaid;

  const financialData = [
    { name: 'In', amount: totalReceived, fill: '#10B981' }, 
    { name: 'Out', amount: totalPaid, fill: '#EF4444' },    
  ];

  // Pagination Math
  const indexOfLastJob = currentPage * itemsPerPage;
  const indexOfFirstJob = indexOfLastJob - itemsPerPage;
  const currentJobs = jobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(jobs.length / itemsPerPage);

  const filteredAuditLogs = auditLogs.filter(log => {
      const matchUser = auditUserFilter === 'ALL' ? true : log.user_name === auditUserFilter;
      const matchDate = auditDateFilter === '' ? true : log.timestamp.startsWith(auditDateFilter);
      return matchUser && matchDate;
  });

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 animate-pulse">Initializing Systems...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100">
      
      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-50 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white p-2.5 rounded-xl shadow-lg shadow-slate-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 uppercase">Logistics<span className="text-blue-600">ERP</span></span>
        </div>
        <div className="flex items-center gap-8">
             <div className="hidden lg:flex gap-6">
                <Link href="/reports" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Reports</Link>
                <Link href="/transactions" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Transactions</Link>
             </div>
             <div className="h-6 w-px bg-slate-200"></div>
             <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                     <p className="text-sm font-black text-slate-900 capitalize">{currentUser}</p>
                     <p className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ONLINE</p>
                 </div>
                 <button onClick={handleLogout} className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 p-2.5 rounded-xl transition-all border border-slate-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                 </button>
             </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-8 space-y-10">
        
        {/* HERO SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
                <p className="text-slate-500 font-medium">Global logistics overview and financial health.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <Link href="/jobs/new" className="flex-1 md:flex-none">
                    <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        New Shipment
                    </button>
                </Link>
            </div>
        </div>

        {/* KPI DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Liquidity</p>
                <h2 className="text-3xl font-black mt-2 text-slate-900">{netBalance.toLocaleString()}<span className="text-sm font-bold ml-1 text-slate-400">OMR</span></h2>
                <div className="mt-4 flex gap-3 text-[11px] font-bold">
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+{totalReceived.toLocaleString()}</span>
                    <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">-{totalPaid.toLocaleString()}</span>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Flow Analytics</p>
                    <Link href="/reports" className="text-[10px] text-blue-600 font-black hover:underline">REPORTS ↗</Link>
                </div>
                <div className="h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financialData} layout="vertical">
                            <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={12}>
                                {financialData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <Link href="/tools/ai-scanner" className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200 group relative overflow-hidden">
                <div className="relative z-10">
                    <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                    </div>
                    <h3 className="text-white font-bold">AI Scanner</h3>
                    <p className="text-slate-400 text-xs mt-1">OCR Receipt Processing</p>
                </div>
                <div className="absolute -right-4 -bottom-4 text-white/5 rotate-12 group-hover:rotate-0 transition-all">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                </div>
            </Link>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
            
            {/* MAIN TABLE AREA */}
            <div className="col-span-12 xl:col-span-8 space-y-4">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Active Shipments</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{jobs.length} total entries</p>
                        </div>
                        <div className="flex gap-2">
                             {/* Optional Search Bar can go here */}
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Entities</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistics Path</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentJobs.length === 0 ? (
                                    <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold italic">No active data streams.</td></tr>
                                ) : (
                                    currentJobs.map((job) => (
                                        <tr key={job.id} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-lg border border-blue-100">#{job.id}</span>
                                                    <span className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{job.job_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-black text-slate-900">{job.client?.name || job.client_details?.name || '---'}</p>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">{job.client?.phone || job.client_details?.phone || 'No Contact'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">{job.port_loading}</span>
                                                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">{job.port_discharge}</span>
                                                </div>
                                                <div className="mt-2 flex gap-2">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${job.transport_mode === 'SEA' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                                        {job.transport_mode} FREIGHT
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === job.id ? null : job.id); }}
                                                    className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all"
                                                >
                                                    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                </button>

                                                {activeMenu === job.id && (
                                                    <div className="absolute right-8 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] py-2 animate-in fade-in zoom-in-95 duration-150">
                                                        <Link href={`/jobs/${job.id}/view`} className="flex items-center gap-3 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                            Full Analysis
                                                        </Link>
                                                        <Link href={`/invoices/${job.id}`} className="flex items-center gap-3 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                                            Generate Invoice
                                                        </Link>
                                                        <div className="h-px bg-slate-100 my-2"></div>
                                                        <button onClick={() => handleDeleteJob(job.id)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                            Terminate Job
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ENTERPRISE PAGINATION CONTROLS */}
                    {jobs.length > itemsPerPage && (
                        <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                                PAGE {currentPage} OF {totalPages} <span className="mx-2">•</span> {jobs.length} TOTAL SHIPMENTS
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:shadow-sm transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                                </button>
                                
                                <div className="flex gap-1 mx-2">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-200'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:shadow-sm transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR: AUDIT LOG */}
            <div className="col-span-12 xl:col-span-4 space-y-4">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-8 flex flex-col h-[700px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-black text-slate-900">Live Audit</h2>
                        <button onClick={() => setShowAuditFilter(!showAuditFilter)} className={`p-2 rounded-xl border transition-all ${showAuditFilter ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                        </button>
                    </div>

                    {showAuditFilter && (
                        <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                            <select 
                                value={auditUserFilter} 
                                onChange={(e) => setAuditUserFilter(e.target.value)}
                                className="w-full text-[11px] font-black p-3 rounded-xl border-slate-200 outline-none focus:ring-2 ring-blue-500/20"
                            >
                                <option value="ALL">ALL OPERATORS</option>
                                {Array.from(new Set(auditLogs.map(l => l.user_name))).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                            </select>
                            <input 
                                type="date" 
                                value={auditDateFilter} 
                                onChange={(e) => setAuditDateFilter(e.target.value)}
                                className="w-full text-[11px] font-black p-3 rounded-xl border-slate-200 outline-none"
                            />
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                        {filteredAuditLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 font-black uppercase text-[10px]">No logs detected</div>
                        ) : (
                            filteredAuditLogs.map((log) => (
                                <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 py-1 group">
                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-blue-500 transition-colors"></div>
                                    <div className="flex justify-between items-start">
                                        <p className="text-[11px] font-black text-blue-600 uppercase tracking-tight">{log.user_name}</p>
                                        <p className="text-[9px] font-bold text-slate-300">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 mt-1 leading-relaxed">{log.action}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
      </main>
      
      {/* GLOBAL FOOTER STICKER */}
      <div className="fixed bottom-6 right-8 bg-white/80 backdrop-blur border border-slate-200 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Engine v4.0.2 Stable</span>
      </div>
    </div>
  );
}