import React, { useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { API } from '../api';

export default function ReturnRequestModal({ isOpen, onClose, shoe, onRefresh }) {
  const [reason, setReason] = useState('Vendor requesting stock return');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !shoe) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await API.createReturnRequest(shoe.id, reason);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit return request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121827] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100">
        <div className="p-5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Request Inventory Return</h3>
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

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
            <p className="font-semibold text-white">{shoe.brand} {shoe.model}</p>
            <p className="text-slate-400">SKU: {shoe.sku} | Quantity: {shoe.qty}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Recall / Return</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you wish to recall this consignment inventory..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Raise Return Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
