import React, { useState } from 'react';
import { X, Package, DollarSign, Plus, Check } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ShoeModal({ isOpen, onClose, shoe, onRefresh }) {
  const { role } = useAuth();
  const isEdit = !!shoe;
  const isAdminPricing = role === 'admin' && isEdit;

  const [formData, setFormData] = useState({
    brand: shoe?.brand || 'Nike',
    model: shoe?.model || '',
    size: shoe?.size || 'US 9',
    sku: shoe?.sku || '',
    condition: shoe?.condition || 'New',
    askingPrice: shoe?.askingPrice || '',
    adminPrice: shoe?.adminPrice || shoe?.askingPrice || '',
    qty: shoe?.qty || 1,
    status: shoe?.status || 'priced'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminPricing) {
        await API.adminPriceShoe(shoe.id, formData.adminPrice, formData.status);
      } else if (isEdit) {
        await API.updateShoe(shoe.id, formData);
      } else {
        await API.createShoe(formData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        <div className="p-5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">
              {isAdminPricing ? 'Admin Review & Price Listing' : isEdit ? 'Edit Sneaker Listing' : 'List New Consignment Sneaker'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {isAdminPricing ? (
            /* Admin Pricing & Status Form */
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="font-semibold text-slate-200">{shoe.brand} {shoe.model}</p>
                <p className="text-slate-400">SKU: {shoe.sku} | Size: {shoe.size} | Vendor Asking: ₹{shoe.askingPrice}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Approved Admin Price (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.adminPrice}
                  onChange={(e) => setFormData({ ...formData, adminPrice: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Listing Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="priced">Priced (Awaiting Vendor Acceptance)</option>
                  <option value="live">Live on Vault (Ready to sell)</option>
                  <option value="sold">Sold</option>
                  <option value="returned">Returned to Vendor</option>
                </select>
              </div>
            </div>
          ) : (
            /* Vendor Create/Edit Form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Nike, Adidas, Air Jordan"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. Air Jordan 1 High"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. AJ1-CHI-9"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Size</label>
                  <input
                    type="text"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g. US 9"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="New">New / Deadstock</option>
                    <option value="Used - Like New">Used - Like New</option>
                    <option value="Used - Good">Used - Good</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Asking Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.askingPrice}
                    onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                    placeholder="18999"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

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
              <span>{loading ? 'Saving...' : isAdminPricing ? 'Save Admin Price' : isEdit ? 'Update Listing' : 'Submit Listing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
