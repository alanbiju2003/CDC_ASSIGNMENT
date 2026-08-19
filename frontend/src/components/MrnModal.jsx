import React, { useState } from 'react';
import { X, FileCheck, Check, PenTool, Download } from 'lucide-react';
import { API, getAuthToken } from '../api';
import { useAuth } from '../context/AuthContext';

export default function MrnModal({ isOpen, onClose, mrn, mode = 'create', onRefresh }) {
  const { user } = useAuth();
  const [vendorEmail, setVendorEmail] = useState('vendor1@example.test');
  const [itemsText, setItemsText] = useState('AJ1-CHI-9:2, YZY-ZEB-10:1');
  const [signedName, setSignedName] = useState(user?.name || '');
  const [isCheck, setIsCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Parse items string: "SKU1:QTY1, SKU2:QTY2"
      const items = itemsText.split(',').map((part) => {
        const [sku, qtyStr] = part.split(':').map((s) => s.trim());
        return { sku: sku || 'SKU-UNKNOWN', qty: parseInt(qtyStr || '1', 10) };
      });

      await API.createMrn(vendorEmail, items);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create MRN.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (e) => {
    e.preventDefault();
    if (!isCheck) {
      setError('Please check the acknowledgment box to complete electronic signature.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await API.signMrn(mrn.id, signedName || user?.name || user?.email);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to e-sign MRN.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const token = getAuthToken();
    window.open(`/api/mrn/${mrn.id}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        <div className="p-5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">
              {mode === 'create' ? 'Issue Material Receiving Note (MRN)' : `E-Sign Document: ${mrn?.id}`}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'create' ? (
          /* Admin Creation Form */
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Vendor Email</label>
              <select
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="vendor1@example.test">vendor1@example.test (Alpha Kicks Co)</option>
                <option value="vendor2@example.test">vendor2@example.test (Beta Soles Co)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Received Items (SKU:Qty format)</label>
              <textarea
                required
                rows={3}
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                placeholder="AJ1-CHI-9:2, YZY-ZEB-10:1"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Separate multiple items with commas. Format: SKU:Quantity</p>
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Issue MRN'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Vendor E-Signature Form */
          <form onSubmit={handleSign} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>MRN ID: <strong className="text-white">{mrn.id}</strong></span>
                <span>Vendor: <strong className="text-white">{mrn.vendorEmail}</strong></span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Received Consignment Items:</span>
                <ul className="list-disc list-inside text-emerald-400 font-mono">
                  {(() => {
                    try {
                      const items = typeof mrn.items === 'string' ? JSON.parse(mrn.items) : mrn.items;
                      return items.map((it, idx) => (
                        <li key={idx}>{it.sku} — {it.qty} pair(s)</li>
                      ));
                    } catch (e) {
                      return <li>{mrn.items}</li>;
                    }
                  })()}
                </ul>
              </div>
            </div>

            {mrn.status === 'signed' ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Electronic Signature Verified
                </p>
                <p className="text-[11px] text-slate-400">Signed By: {mrn.signedBy} at {new Date(mrn.signedAt).toLocaleString()}</p>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full mt-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Signed MRN PDF
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name (E-Signer)</label>
                  <input
                    type="text"
                    required
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                    placeholder="Vendor Representative Name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <label className="flex items-start gap-2.5 p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCheck}
                    onChange={(e) => setIsCheck(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I confirm physical receipt & verification of the listed consignment sneakers above. I agree to apply my digital signature timestamped at {new Date().toLocaleTimeString()}.
                  </span>
                </label>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
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
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center gap-1.5"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>{loading ? 'Signing...' : 'Sign MRN Document'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
