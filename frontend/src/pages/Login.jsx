import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickFill = (type) => {
    if (type === 'admin') {
      setEmail('admin@kickvault.test');
      setPassword('Passw0rd!');
    } else if (type === 'vendor1') {
      setEmail('vendor1@example.test');
      setPassword('Passw0rd!');
    } else if (type === 'vendor2') {
      setEmail('vendor2@example.test');
      setPassword('Passw0rd!');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Hero Branding + Floating Sneaker Image */}
        <div className="lg:col-span-6 space-y-6 p-4 lg:p-8 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-lg font-heading">
              KV
            </div>
            <span className="text-xl font-bold font-heading tracking-wide">KickVault</span>
          </div>

          <div className="space-y-3 max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-black font-heading leading-tight tracking-tight">
              Powering the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Sneaker & Streetwear
              </span> <br />
              Marketplace.
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              A B2B consignment platform built for vendors and admins to connect, manage, and grow — <span className="text-emerald-400 font-medium">effortlessly.</span>
            </p>
          </div>

          {/* Sneaker Image Container */}
          <div className="relative pt-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-3xl blur-2xl pointer-events-none"></div>
            <img
              src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800&auto=format&fit=crop"
              alt="Air Jordan Consignment Sneaker"
              className="w-full max-w-md h-56 lg:h-64 rounded-3xl shadow-2xl border border-slate-800 object-cover object-center relative z-10 hover:scale-[1.02] transition-transform duration-500"
            />
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-0.5">
              <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Trusted
              </div>
              <p className="text-[10px] text-slate-400">Top Vendors</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-0.5">
              <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Secure
              </div>
              <p className="text-[10px] text-slate-400">Encrypted JWT</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-0.5">
              <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Scale
              </div>
              <p className="text-[10px] text-slate-400">Automated Sync</p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            © 2026 KickVault Consignment Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side: Smart Unified Login Form */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-[#111726]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-1 mx-auto flex items-center justify-center text-emerald-400 font-bold text-2xl shadow-lg shadow-emerald-500/10 font-heading">
                KV
              </div>
              <h2 className="text-2xl font-bold font-heading text-slate-100">Welcome Back</h2>
              <p className="text-xs text-slate-400">Sign in to access your KickVault account</p>
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
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Demo environment: Use password Passw0rd!'); }} className="text-[11px] text-emerald-400 hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
