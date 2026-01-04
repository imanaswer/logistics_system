"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authenticate with Backend
      const res = await axios.post('http://127.0.0.1:8000/api/login/', { username, password });
      
      // 2. Save Credentials Securely
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', username);
      
      // 3. HARD REDIRECT (Forces browser to reload and clear old state)
      window.location.href = '/'; 

    } catch (err) {
      console.error(err);
      setError('Invalid Username or Password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* LEFT SIDE: Branding / Image */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/90 z-10"></div>
        {/* Background Image */}
        <div className="absolute inset-0 z-0 opacity-40" 
             style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
             }}>
        </div>
        
        <div className="relative z-20 text-center px-10">
            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">LogisticsERP</h1>
            <p className="text-blue-200 text-lg max-w-md mx-auto leading-relaxed">
                Manage shipments, track finances, and generate invoices with enterprise-grade precision.
            </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900">LogisticsERP</h1>
            </div>

            <div>
                <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-500">Please sign in to your account.</p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm font-medium animate-pulse">
                    {error}
                </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                    <input 
                        type="text" 
                        required 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        placeholder="Enter your username"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                    <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        placeholder="••••••••"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div className="text-center mt-6">
                <p className="text-xs text-slate-400">Protected by secure enterprise authentication.</p>
            </div>
        </div>
      </div>
    </div>
  );
}