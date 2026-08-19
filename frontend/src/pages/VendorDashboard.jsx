import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle2, TrendingUp, AlertTriangle, FileCheck, ArrowUpRight, Plus, Receipt } from 'lucide-react';
import { API } from '../api';
import StatusBadge from '../components/StatusBadge';
import ShoeModal from '../components/ShoeModal';

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [recentShoes, setRecentShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, shoeRes] = await Promise.all([
        API.getDashboardStats(),
        API.getShoes()
      ]);
      setStats(dashRes.stats);
      setRecentShoes((shoeRes.shoes || []).slice(0, 5));
    } catch (err) {
      console.error('Error loading vendor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">Loading your KickVault vendor metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Vendor Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Overview of your consignment inventory, sales, and pending settlements</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>List New Sneaker</span>
        </button>
      </div>

      {/* KYC Alert if Pending */}
      {stats?.userStatus === 'pending_kyc' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">KYC Verification Outstanding</h4>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Complete your PAN validation to unlock live listings and receive automatic payouts.
              </p>
            </div>
          </div>
          <Link
            to="/kyc"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors text-center shrink-0"
          >
            Verify PAN Now →
          </Link>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Listings</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-heading">{stats?.totalShoes || 0}</div>
          <p className="text-[11px] text-slate-500">Pairs listed on consignment</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Live Inventory</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-heading">{stats?.liveShoes || 0}</div>
          <p className="text-[11px] text-slate-500">Active and available to buy</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Sold Pairs</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-400 font-heading">{stats?.totalSoldQty || 0}</div>
          <p className="text-[11px] text-slate-500">Successful sales completed</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-heading">
            ₹{(stats?.totalSoldVal || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">Total gross value of sold sneakers</p>
        </div>
      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.pendingMrns > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{stats.pendingMrns} MRN Document(s) Awaiting E-Signature</h4>
                <p className="text-[11px] text-slate-400">Sign receiving notes to verify physical inventory receipt.</p>
              </div>
            </div>
            <Link to="/mrns" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300">
              Review →
            </Link>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Consignment Settlement Payouts</h4>
              <p className="text-[11px] text-slate-400">Track commission deductions and upcoming bank transfers.</p>
            </div>
          </div>
          <Link to="/payments" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/20 hover:bg-violet-500/30 text-violet-300">
            View Summary →
          </Link>
        </div>
      </div>

      {/* Recent Inventory Table */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Sneaker Listings</h3>
            <p className="text-xs text-slate-400">Your latest submitted and live consignment items</p>
          </div>
          <Link to="/inventory" className="text-xs text-emerald-400 hover:underline font-semibold">
            View All ({stats?.totalShoes || 0}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Sneaker</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Size</th>
                <th className="p-3">Asking Price</th>
                <th className="p-3">Approved Price</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentShoes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No sneaker listings found. Click "List New Sneaker" above to start!
                  </td>
                </tr>
              ) : (
                recentShoes.map((shoe) => (
                  <tr key={shoe.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      {shoe.brand} {shoe.model}
                    </td>
                    <td className="p-3 font-mono text-slate-400">{shoe.sku}</td>
                    <td className="p-3">{shoe.size}</td>
                    <td className="p-3">₹{shoe.askingPrice.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-semibold text-emerald-400">
                      {shoe.adminPrice ? `₹${shoe.adminPrice.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={shoe.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShoeModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onRefresh={loadData} />
    </div>
  );
}
