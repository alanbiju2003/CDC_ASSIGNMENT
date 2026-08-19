import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, TrendingUp, RefreshCw, AlertCircle, ShieldCheck, ArrowUpRight, Clock, Check, UserPlus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { API } from '../api';
import StatusBadge from '../components/StatusBadge';
import VendorOnboardModal from '../components/VendorOnboardModal';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.getDashboardStats();
      setData(res);
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerCronSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      const res = await API.triggerCronSync();
      setSyncMessage(res.message);
      await loadData();
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">Loading KickVault admin platform analytics...</div>;
  }

  const stats = data?.stats || {};
  const chartData = data?.chartData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Admin Executive HQ</h1>
          <p className="text-xs text-slate-400 mt-1">Platform metrics, vendor oversight, pricing queues & scheduled sync operations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOnboardOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Vendor</span>
          </button>

          {/* 1-Click Scheduled Sync Trigger */}
          <button
            onClick={handleTriggerCronSync}
            disabled={syncing}
            className="btn-violet px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing CSV...' : 'Run Stock Sync (Cron)'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Vendors</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-heading">{stats.totalVendors || 0}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-emerald-400">{stats.activeVendors || 0} Active</span>
            <span className="text-amber-400">{stats.pendingKycVendors || 0} Pending KYC</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Live Vault Listings</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-heading">{stats.liveListings || 0}</div>
          <p className="text-[11px] text-slate-500">Priced & active for buyers</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sold Value</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-heading">
            ₹{(stats.totalSoldVal || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">Gross sales across platform</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Price Requests</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-400 font-heading">{stats.pendingPriceReqs || 0}</div>
          <Link to="/price-requests" className="text-[11px] text-blue-400 hover:underline block">
            Review vendor price changes →
          </Link>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-heading">Consignment Sales & Revenue Trend</h3>
            <p className="text-xs text-slate-400">Monthly gross sales volume across all consignment vendors</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
            +38.5% Growth
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Gross Sold Value']}
              />
              <Area type="monotone" dataKey="soldVal" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admin Action Queues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Price Change Requests</h4>
            <span className="text-xs font-bold text-amber-400">{stats.pendingPriceReqs} Pending</span>
          </div>
          <p className="text-xs text-slate-400">Vendors requesting updated consignment asking prices.</p>
          <Link to="/price-requests" className="inline-block text-xs font-bold text-emerald-400 hover:underline">
            Manage Price Queue →
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Unsigned MRN Notes</h4>
            <span className="text-xs font-bold text-amber-400">{stats.unsignedMrns} Pending</span>
          </div>
          <p className="text-xs text-slate-400">Material receiving notes awaiting vendor digital signatures.</p>
          <Link to="/mrns" className="inline-block text-xs font-bold text-emerald-400 hover:underline">
            View MRN Registry →
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Return Requests</h4>
            <span className="text-xs font-bold text-amber-400">{stats.pendingReturnReqs} Pending</span>
          </div>
          <p className="text-xs text-slate-400">Inventory recall and return requests submitted by vendors.</p>
          <Link to="/returns" className="inline-block text-xs font-bold text-emerald-400 hover:underline">
            Manage Returns →
          </Link>
        </div>
      </div>

      <VendorOnboardModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onVendorCreated={() => loadData()}
      />
    </div>
  );
}
