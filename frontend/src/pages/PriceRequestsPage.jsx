import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Check, X, Clock } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function PriceRequestsPage() {
  const { role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.getPriceRequests();
      setRequests(res.requests || []);
    } catch (err) {
      console.error('Error fetching price requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRespond = async (id, action) => {
    try {
      await API.respondPriceRequest(id, action);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Price-Change Requests</h1>
        <p className="text-xs text-slate-400 mt-1">
          {role === 'admin'
            ? 'Review and approve/reject price adjustment requests submitted by consignment vendors'
            : 'Track status of your requested price changes for active inventory listings'}
        </p>
      </div>

      {/* Requests Table */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Request ID</th>
                <th className="p-3">Shoe Listing</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Current Asking</th>
                <th className="p-3">Requested New Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted Date</th>
                {role === 'admin' && <th className="p-3 text-right">Admin Decision</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading price-change requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">No price-change requests recorded.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{req.id}</span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      <div>{req.brand} {req.model}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {req.shoeId} | SKU: {req.sku}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-300">{req.vendorEmail}</td>
                    <td className="p-3 font-medium text-slate-400">
                      ₹{(req.askingPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-bold text-emerald-400 text-sm">
                      ₹{(req.requestedPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    {role === 'admin' && (
                      <td className="p-3 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRespond(req.id, 'approved')}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleRespond(req.id, 'rejected')}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-400 border border-slate-700 text-[11px] transition-colors flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] capitalize">{req.status}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
