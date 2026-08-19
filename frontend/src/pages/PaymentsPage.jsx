import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, ArrowUpRight, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PaymentsPage() {
  const { role } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState('vendor1@example.test');

  const fetchSummary = async (vendorEmail = '') => {
    try {
      setLoading(true);
      const res = await API.getPaymentSummary(vendorEmail);
      setSummary(res.summary);
    } catch (err) {
      console.error('Payment summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchSummary(selectedVendor);
    } else {
      fetchSummary();
    }
  }, [role, selectedVendor]);

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">Calculating vendor payment settlement summary...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Payment & Settlement Summary</h1>
          <p className="text-xs text-slate-400 mt-1">
            Consignment earnings calculation formula: Sold Quantity × Approved Price minus Commission %
          </p>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Vendor Filter:</span>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="vendor1@example.test">Vendor One (Alpha Kicks Co)</option>
              <option value="vendor2@example.test">Vendor Two (Beta Soles Co)</option>
            </select>
          </div>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-heading">
            ₹{(summary?.grossSales || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">From {summary?.itemsSoldTotal || 0} sold sneakers</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Commission Deducted</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-heading">
            ₹{(summary?.totalCommission || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">Fixed rate of {summary?.commissionPct || 12}%</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled & Paid</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-heading">
            ₹{(summary?.settledPayout || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">Transferred via SENT invoices</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Payout</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-400 font-heading">
            ₹{(summary?.pendingPayout || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">Draft invoices awaiting dispatch</p>
        </div>
      </div>

      {/* Sold Sneaker Ledger Table */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white font-heading">Sold Consignment Item Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Sneaker Model</th>
                <th className="p-3">Units Sold</th>
                <th className="p-3">Approved Price / Unit</th>
                <th className="p-3">Gross Sales</th>
                <th className="p-3">Commission ({summary?.commissionPct}%)</th>
                <th className="p-3 text-right">Net Vendor Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(!summary?.soldShoes || summary.soldShoes.length === 0) ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No sold inventory units recorded for this vendor.</td>
                </tr>
              ) : (
                summary.soldShoes.map((shoe) => {
                  const price = shoe.adminPrice || shoe.askingPrice || 0;
                  const itemGross = price * shoe.soldQty;
                  const itemComm = Math.round((itemGross * (summary.commissionPct || 12)) / 100);
                  const itemNet = itemGross - itemComm;

                  return (
                    <tr key={shoe.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-semibold text-white">{shoe.sku}</td>
                      <td className="p-3 text-slate-200">{shoe.brand} {shoe.model}</td>
                      <td className="p-3 font-bold text-purple-400">{shoe.soldQty}</td>
                      <td className="p-3">₹{price.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-semibold text-slate-200">₹{itemGross.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-red-400">- ₹{itemComm.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-bold text-emerald-400 text-right">₹{itemNet.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
