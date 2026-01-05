"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
// 1. Import the global config
import { API_URL } from '../config'; 

export default function Transactions() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('CR');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }
        try {
            const config = { headers: { Authorization: `Token ${token}` } };
            // 2. Use API_URL here
            const [jobsRes, histRes] = await Promise.all([
                axios.get(`${API_URL}/api/jobs/`, config),
                axios.get(`${API_URL}/api/transactions/`, config)
            ]);
            setJobs(jobsRes.data);
            setHistory(histRes.data);
        } catch (error) { console.error(error); }
    };
    init();
  }, []);

  const handleSubmit = async () => {
    if (!amount || !partyName) { alert("Please enter Amount and Party Name"); return; }
    setLoading(true);
    const token = localStorage.getItem('token');
    const jobIdToSend = (selectedJob && selectedJob !== "") ? parseInt(selectedJob) : null;
    try {
        // 3. Use API_URL here
        const res = await axios.post(`${API_URL}/api/transactions/`, {
            trans_type: activeTab, amount: parseFloat(amount), date, party_name: partyName, description, job: jobIdToSend
        }, { headers: { Authorization: `Token ${token}` } });
        setHistory([res.data, ...history]);
        setAmount(''); setPartyName(''); setDescription(''); setSelectedJob('');
        alert("Success!");
    } catch (error) { alert("Failed."); } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
      if(!confirm("Delete?")) return;
      try {
          // 4. Use API_URL here
          await axios.delete(`${API_URL}/api/transactions/${id}/`, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } });
          setHistory(history.filter(t => t.id !== id));
      } catch(err) { alert("Failed"); }
  };

  const tabClass = (tab: string) => `flex-1 py-3 text-xs font-bold uppercase transition rounded-lg ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center font-sans">
      <button onClick={() => router.push('/')} className="fixed top-6 right-6 bg-white text-slate-700 hover:text-blue-600 p-3 rounded-full shadow-lg border border-slate-200 z-50">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      <div className="w-full max-w-3xl space-y-8">
          <div><h1 className="text-2xl font-black text-slate-900">Record Transaction</h1><p className="text-slate-500 text-sm">Add a new financial entry.</p></div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex bg-slate-100/50">
              {['CR', 'CP', 'BR', 'BP'].map((t) => (
                  <button key={t} onClick={() => setActiveTab(t)} className={tabClass(t)}>
                      {t === 'CR' ? 'Cash Rec.' : t === 'CP' ? 'Cash Pay' : t === 'BR' ? 'Bank Rec.' : 'Bank Pay'}
                  </button>
              ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
              <div className="flex gap-4 items-center border-b border-slate-100 pb-4 mb-4">
                  <div className={`p-3 rounded-full ${['CR','BR'].includes(activeTab) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {['CR','BR'].includes(activeTab) ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>}
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-900 text-lg">{activeTab === 'CR' ? 'Cash Receipt' : activeTab === 'CP' ? 'Cash Payment' : activeTab === 'BR' ? 'Bank Receipt' : 'Bank Payment'}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase">{['CR','BR'].includes(activeTab) ? 'Money In' : 'Money Out'}</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount (OMR)</label>
                      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 text-xl font-black text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="0.000" />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 font-bold text-slate-900 bg-slate-50 rounded-lg border border-slate-200 outline-none" />
                  </div>
                  <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Link Job (Optional)</label>
                      <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="w-full p-3 font-bold text-slate-900 bg-slate-50 rounded-lg border border-slate-200 outline-none">
                          <option value="">-- General Transaction --</option>
                          {jobs.map(job => <option key={job.id} value={job.id}>Job #{job.id} - {job.client?.name || job.client_details?.name}</option>)}
                      </select>
                  </div>
                  <div className="col-span-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{['CR','BR'].includes(activeTab) ? "Received From" : "Paid To"}</label>
                       <input type="text" value={partyName} onChange={e => setPartyName(e.target.value)} className="w-full p-3 font-bold text-slate-900 bg-slate-50 rounded-lg border border-slate-200 outline-none" placeholder="Name..." />
                  </div>
                  <div className="col-span-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                       <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 font-bold text-slate-900 bg-slate-50 rounded-lg border border-slate-200 outline-none" placeholder="Notes..." />
                  </div>
              </div>
              <button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold shadow-lg transition transform active:scale-[0.98]">
                  {loading ? 'Saving...' : 'Confirm Transaction'}
              </button>
          </div>

          <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pl-2">Recent Transactions</h3>
              {history.map((t) => (
                  <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center hover:bg-slate-50 transition group">
                      <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[10px] ${['CR','BR'].includes(t.trans_type) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {t.trans_type}
                          </div>
                          <div>
                              <p className="text-sm font-bold text-slate-900">{t.party_name}</p>
                              <p className="text-xs text-slate-400">{t.date} • {t.job ? `Job #${t.job}` : 'General'}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className={`font-black text-sm ${['CR','BR'].includes(t.trans_type) ? 'text-green-600' : 'text-red-600'}`}>
                              {['CR','BR'].includes(t.trans_type) ? '+' : '-'} {Number(t.amount).toLocaleString()}
                          </span>
                          <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">✕</button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}