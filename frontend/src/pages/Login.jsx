import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Store, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { loginAdmin, loginVendor } = useAuth();
  
  const [activeTab, setActiveTab] = useState('vendor'); // 'vendor' | 'admin'
  const [email, setEmail] = useState('vendor1@example.test');
  const [password, setPassword] = useState('Passw0rd!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'admin') {
        await loginAdmin(email, password);
      } else {
        await loginVendor(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickFill = (type) => {
    if (type === 'admin') {
      setActiveTab('admin');
      setEmail('admin@kickvault.test');
      setPassword('Passw0rd!');
    } else if (type === 'vendor1') {
      setActiveTab('vendor');
      setEmail('vendor1@example.test');
      setPassword('Passw0rd!');
    } else if (type === 'vendor2') {
      setActiveTab('vendor');
      setEmail('vendor2@example.test');
      setPassword('Passw0rd!');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#121827] border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-slate-100 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center font-bold text-emerald-400 text-xl font-heading">
              KV
            </div>
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-wide">KickVault</h1>
          <p className="text-xs text-slate-400">B2B Sneaker & Streetwear Consignment Portal</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('vendor');
              setEmail('vendor1@example.test');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'vendor'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Vendor Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setEmail('admin@kickvault.test');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Admin Login
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300'
            }`}
          >
            <span>{loading ? 'Authenticating...' : `Sign in as ${activeTab === 'admin' ? 'Admin' : 'Vendor'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Reviewer Quick Presets */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Reviewer Preset Logins:
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => setQuickFill('admin')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-violet-600/30 text-violet-300 border border-slate-700 hover:border-violet-500/50 transition-colors font-medium truncate"
            >
              Admin HQ
            </button>
            <button
              onClick={() => setQuickFill('vendor1')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-slate-700 hover:border-emerald-500/50 transition-colors font-medium truncate"
            >
              Vendor 1 (Active)
            </button>
            <button
              onClick={() => setQuickFill('vendor2')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700 hover:border-amber-500/50 transition-colors font-medium truncate"
            >
              Vendor 2 (KYC)
            </button>
          </div>
        </div>

        {/* Footer link */}
        {activeTab === 'vendor' && (
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              New sneaker vendor?{' '}
              <Link to="/register" className="text-emerald-400 hover:underline font-semibold">
                Register vendor account →
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
