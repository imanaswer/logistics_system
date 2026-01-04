"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from 'recharts';

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

  // Dropdown State
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  // Audit Filters
  const [showAuditFilter, setShowAuditFilter] = useState(false);
  const [auditUserFilter, setAuditUserFilter] = useState('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  // --- 1. AUTH & DATA FETCH ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    
    if (!token) { window.location.href = '/login'; return; }
    if (user) setCurrentUser(user);
    
    fetchData(token);

    // Close dropdowns on click outside
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const config = { headers: { Authorization: `Token ${token}` } };
      const [jobsRes, transRes, auditRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/jobs/', config),
        axios.get('http://127.0.0.1:8000/api/transactions/', config),
        axios.get('http://127.0.0.1:8000/api/audit-logs/', config)
      ]);
      
      setJobs(jobsRes.data);
      setTransactions(transRes.data);
      setAuditLogs(auditRes.data);
      setLoading(false);
    } catch (error: any) { 
        console.error("Auth Error", error);
        if (error.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
    }
  };

  const handleLogout = () => {
      if(confirm("Sign out?")) { localStorage.clear(); window.location.href = '/login'; }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm("Are you sure? This will delete the Job and its Invoice.")) return;
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://127.0.0.1:8000/api/jobs/${id}/`, { headers: { Authorization: `Token ${token}` } });
        setJobs(jobs.filter(job => job.id !== id));
    } catch (error) { alert("Delete failed."); }
  };

  // --- 2. CALCULATIONS ---
  const totalReceived = transactions.filter(t => ['CR', 'BR'].includes(t.trans_type)).reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPaid = transactions.filter(t => ['CP', 'BP'].includes(t.trans_type)).reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalReceived - totalPaid;

  const financialData = [
    { name: 'In', amount: totalReceived, fill: '#10B981' }, 
    { name: 'Out', amount: totalPaid, fill: '#EF4444' },    
  ];

  // Filter Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
      const matchUser = auditUserFilter === 'ALL' ? true : log.user_name === auditUserFilter;
      const matchDate = auditDateFilter === '' ? true : log.timestamp.startsWith(auditDateFilter);
      return matchUser && matchDate;
  });

  const uniqueUsers = Array.from(new Set(auditLogs.map(l => l.user_name)));

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2 rounded-md shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">LogisticsERP</span>
        </div>
        <div className="flex items-center gap-6">
             <Link href="/reports" className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition">Reports</Link>
             <Link href="/transactions" className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition">Transactions</Link>
             <div className="h-5 w-px bg-slate-200"></div>
             <div className="flex items-center gap-3">
                 <div className="text-right hidden md:block">
                     <p className="text-sm font-bold text-slate-900 capitalize">{currentUser}</p>
                     <p className="text-xs text-green-600 font-bold">● Online</p>
                 </div>
                 <button onClick={handleLogout} className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 p-2 rounded-md transition border border-slate-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                 </button>
             </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* HEADER & ACTIONS */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">Overview of shipments and finances.</p>
            </div>
            <div className="flex gap-3">
                <Link href="/transactions">
                    <button className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-md shadow-sm transition text-sm">
                        Record Transaction
                    </button>
                </Link>
                <Link href="/jobs/new">
                    <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md shadow-sm transition text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        New Shipment
                    </button>
                </Link>
            </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Net Balance */}
            <div className="bg-slate-900 rounded-xl p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.29 0 2.13-.77 2.13-2.11 0-2.6-5.83-2.25-5.83-6.57 0-1.76 1.34-3.09 3.08-3.37V2.5h2.67v1.93c1.61.32 2.89 1.48 3.03 3.16h-1.95c-.15-.94-1.07-1.57-2.31-1.57-1.35 0-2.2.82-2.2 2.03 0 2.37 5.83 2.06 5.83 6.61 0 1.76-1.39 3.12-3.14 3.43z"/></svg>
                </div>
                <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Net Balance</p>
                    <h2 className="text-4xl font-bold mt-2">{netBalance.toLocaleString()} <span className="text-xl text-slate-500 font-normal">OMR</span></h2>
                </div>
                <div className="mt-6 flex gap-4 text-sm font-medium">
                    <span className="text-green-400 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> {totalReceived.toLocaleString()}</span>
                    <span className="text-red-400 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg> {totalPaid.toLocaleString()}</span>
                </div>
            </div>

            {/* Cash Flow */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Cash Flow</h3>
                    <Link href="/reports" className="text-xs text-blue-600 hover:text-blue-800 font-bold">View Report →</Link>
                </div>
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financialData} layout="vertical" barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={30} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '6px', border:'1px solid #e2e8f0'}} />
                            <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
                                {financialData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Tool */}
            <Link href="/tools/ai-scanner" className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md hover:shadow-lg transition flex items-center justify-between group overflow-hidden relative">
                 <div className="absolute -right-6 -bottom-6 text-white/10 transform rotate-12 group-hover:scale-110 transition">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                 </div>
                <div>
                    <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold">AI Scanner</h3>
                    <p className="text-xs text-blue-100 mt-1">Scan receipts automatically.</p>
                </div>
            </Link>
        </div>

        <div className="grid grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Shipments Table */}
            <div className="col-span-12 xl:col-span-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200/60 flex justify-between items-center">
                        <h2 className="text-base font-bold text-slate-900">Active Shipments</h2>
                        <span className="text-xs font-medium text-slate-500">{jobs.length} records</span>
                    </div>
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-200/60">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job ID</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Route & Mode</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {jobs.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400 italic">No active jobs found.</td></tr>
                                ) : (
                                    jobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 align-top">
                                                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded">#{job.id}</span>
                                                <div className="text-[10px] text-slate-400 mt-1.5 font-medium">{job.job_date}</div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="text-sm font-bold text-slate-900">{job.client?.name || job.client_details?.name || 'Unknown Client'}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{job.client?.phone || job.client_details?.phone || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                    <span>{job.port_loading}</span>
                                                    <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                    <span>{job.port_discharge}</span>
                                                </div>
                                                <div className="mt-1.5">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${job.transport_mode === 'SEA' ? 'bg-blue-100 text-blue-700' : job.transport_mode === 'AIR' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {job.transport_mode} Freight
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* DROPDOWN MENU */}
                                            <td className="px-6 py-4 text-right align-top relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === job.id ? null : job.id); }}
                                                    className={`p-2 rounded-full hover:bg-slate-100 transition ${activeMenu === job.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                                </button>

                                                {/* The Dropdown */}
                                                {activeMenu === job.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                        <div className="py-1">
                                                            <Link href={`/jobs/${job.id}/view`} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                                View Details
                                                            </Link>
                                                            <Link href={`/invoices/${job.id}`} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                                Generate Invoice
                                                            </Link>
                                                            <div className="border-t border-slate-100 my-1"></div>
                                                            <button onClick={() => handleDeleteJob(job.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition text-left">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                Delete Job
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Audit Log */}
            <div className="col-span-12 xl:col-span-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
                    <button 
                        onClick={() => setShowAuditFilter(!showAuditFilter)} 
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition border ${showAuditFilter ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                        {showAuditFilter ? 'Close Filters' : 'Filter Log'}
                    </button>
                </div>

                {showAuditFilter && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <select 
                            value={auditUserFilter} 
                            onChange={(e) => setAuditUserFilter(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                        >
                            <option value="ALL">All Users</option>
                            {Array.from(new Set(auditLogs.map(l => l.user_name))).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <input 
                            type="date" 
                            value={auditDateFilter} 
                            onChange={(e) => setAuditDateFilter(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                        />
                        {(auditUserFilter !== 'ALL' || auditDateFilter !== '') && (
                             <button onClick={() => { setAuditUserFilter('ALL'); setAuditDateFilter(''); }} className="w-full text-center text-[10px] font-bold text-red-500 hover:text-red-700 mt-1">Clear Filters</button>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-[500px]">
                    <div className="overflow-y-auto p-0 flex-grow scrollbar-thin scrollbar-thumb-slate-200">
                        {filteredAuditLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <p className="text-xs">No activity found.</p>
                            </div>
                        ) : (
                            filteredAuditLogs.map((log, i) => (
                                <div key={log.id} className={`p-4 flex gap-3 hover:bg-slate-50 transition ${i !== filteredAuditLogs.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                    <div className="mt-0.5">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] uppercase border border-slate-200">
                                            {log.user_name ? log.user_name.substring(0,2) : 'SY'}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">
                                            <span className="text-blue-700 capitalize">{log.user_name}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 leading-snug mt-0.5">{log.action}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}