import React, { useState } from 'react';
import { Calculator, X, DollarSign, Percent, Sparkles, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export default function PricingCalculatorModal({ isOpen, onClose }) {
  const [askingPrice, setAskingPrice] = useState(25000);
  const [commissionPct, setCommissionPct] = useState(12);

  if (!isOpen) return null;

  const price = Number(askingPrice) || 0;
  const commAmount = Math.round((price * commissionPct) / 100);
  const taxReserve = Math.round(price * 0.01); // 1% TDS / Tax deduction
  const netPayout = price - commAmount - taxReserve;

  // Market velocity rating
  let velocity = 'Balanced Market Price';
  let velocityColor = 'text-teal-400';
  if (price <= 18000) {
    velocity = 'High Speed Sale (Competitive Price)';
    velocityColor = 'text-emerald-400';
  } else if (price >= 45000) {
    velocity = 'Premium Luxury Tier (Longer Liquidity Horizon)';
    velocityColor = 'text-amber-400';
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121827] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 text-slate-100 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-heading">Market Payout & Fee Estimator</h3>
              <p className="text-xs text-slate-400">Calculate net vendor disbursement and platform margin breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Asking Price (₹ INR)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="25000"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Platform Commission Rate</label>
              <div className="relative">
                <input
                  type="number"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tax Reserve (TDS 1%)</label>
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-400">
                ₹{taxReserve.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Breakdown Box */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#0c101d] border border-slate-800 space-y-3 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Gross Listing Price:</span>
            <span className="font-mono text-white font-semibold">₹{price.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>KickVault Platform Fee ({commissionPct}%):</span>
            <span className="font-mono text-red-400 font-semibold">- ₹{commAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Statutory Tax Reserve (1%):</span>
            <span className="font-mono text-amber-400 font-semibold">- ₹{taxReserve.toLocaleString('en-IN')}</span>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
            <span className="font-bold text-white">Estimated Net Vendor Payout:</span>
            <span className="font-mono text-lg font-bold text-emerald-400">
              ₹{netPayout > 0 ? netPayout.toLocaleString('en-IN') : 0}
            </span>
          </div>
        </div>

        {/* Market Speed Indicator */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-teal-400" /> Market Liquidity Score:
          </span>
          <span className={`font-bold ${velocityColor}`}>{velocity}</span>
        </div>

        <button
          onClick={onClose}
          className="btn-emerald w-full py-2.5 rounded-xl text-xs font-bold"
        >
          Close Estimator
        </button>
      </div>
    </div>
  );
}
