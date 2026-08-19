import React, { useState } from 'react';
import { X, Receipt, Check } from 'lucide-react';
import { API } from '../api';

export default function InvoiceModal({ isOpen, onClose, onRefresh }) {
  const [vendorEmail, setVendorEmail] = useState('vendor1@example.test');
  const [sku, setSku] = useState('AJ1-CHI-9');
  const [qtySold, setQtySold] = useState(1);
  const [unitPrice, setUnitPrice] = useState(17500);
  const [commissionPct, setCommissionPct] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const lines = [
        {
          sku,
          qtySold: parseInt(qtySold, 10),
          unitPrice: Number(unitPrice)
        }
      ];

      await API.createInvoice(vendorEmail, lines, Number(commissionPct));
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        <div className="p-5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Generate Consignment Invoice</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Vendor</label>
            <select
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="vendor1@example.test">vendor1@example.test (Alpha Kicks Co)</option>
              <option value="vendor2@example.test">vendor2@example.test (Beta Soles Co)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sold Sneaker SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="AJ1-CHI-9"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Qty Sold</label>
              <input
                type="number"
                required
                min="1"
                value={qtySold}
                onChange={(e) => setQtySold(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="17500"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                required
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                placeholder="12"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Gross Sales Amount:</span>
              <span className="font-semibold text-white">₹{(qtySold * unitPrice).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Commission ({commissionPct}%):</span>
              <span className="text-red-400">- ₹{Math.round((qtySold * unitPrice * commissionPct) / 100).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 text-emerald-400 font-bold">
              <span>Net Vendor Payout:</span>
              <span>₹{(qtySold * unitPrice - Math.round((qtySold * unitPrice * commissionPct) / 100)).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Generate Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
