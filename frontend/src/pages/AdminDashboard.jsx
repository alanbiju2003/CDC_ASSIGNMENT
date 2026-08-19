import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, TrendingUp, RefreshCw, AlertCircle, ShieldCheck, ArrowUpRight, Clock, Check, UserPlus, Store } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { API } from '../api';
import StatusBadge from '../components/StatusBadge';
import VendorOnboardModal from '../components/VendorOnboardModal';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resStats, resVendors] = await Promise.all([
        API.getDashboardStats(),
        API.getAdminVendors().catch(() => ({ vendors: [] }))
      ]);
      setData(resStats);
      setVendors(resVendors.vendors || []);
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
          <p className="text-xs text-slate-400 mt-1">Platform metrics, vendor directory, pricing queues & stock sync operations</p>
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
            <span className="text-xs font-semibold uppercase tracking-wider">Live Inventory</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-heading">{stats.liveListings || 0}</div>
          <div className="text-[11px] text-slate-400">
            {stats.totalPairsStock || 0} Total sneaker pairs in consignment
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Gross Sold</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-heading">
            ₹{(stats.totalGrossSoldValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400">
            Across {stats.soldCount || 0} finalized sales
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Action Queue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-heading">
            {(stats.pendingKycVendors || 0) + (stats.pendingPriceReqs || 0) + (stats.pendingReturnReqs || 0)}
          </div>
          <div className="text-[11px] text-slate-400">
            KYC, Pricing & Return items needing review
          </div>
        </div>
      </div>

      {/* Registered Vendors Directory */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Registered Vendors Directory</h3>
              <p className="text-xs text-slate-400">Manage onboarded consignment partner accounts</p>
            </div>
          </div>
          <button
            onClick={() => setIsOnboardOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" /> Onboard Vendor
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Vendor / Store</th>
                <th className="p-3.5">Email Address</th>
                <th className="p-3.5">PAN Number</th>
                <th className="p-3.5">Inventory Stock</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Onboarded</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No vendors registered yet. Click "Onboard Vendor" to add a vendor.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 font-semibold text-slate-100">
                      <div>{v.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{v.businessName || 'Independent Vendor'}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono">{v.email}</td>
                    <td className="p-3.5 font-mono text-slate-300">{v.pan || '—'}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-400">{v.itemCount} items</span>
                      <span className="text-slate-500 ml-1">({v.totalStock} pairs)</span>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      {v.status === 'pending_kyc' ? (
                        <Link
                          to="/admin/kyc"
                          className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-semibold hover:bg-amber-500/20 transition"
                        >
                          Approve KYC →
                        </Link>
                      ) : (
                        <Link
                          to="/inventory"
                          className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium hover:text-white transition"
                        >
                          View Stock →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Sales Chart */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <h3 className="text-base font-bold font-heading text-white">Consignment Sales & Revenue Trend</h3>
        <p className="text-xs text-slate-400">Monthly gross sales volume across all consignment vendors</p>
        <div className="h-64 pt-2">
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
