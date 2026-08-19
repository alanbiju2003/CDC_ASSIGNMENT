import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function ReturnsPage() {
  const { role } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await API.getReturnRequests();
      setReturns(res.requests || []);
    } catch (err) {
      console.error('Error fetching return requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleRespond = async (id, action) => {
    try {
      await API.respondReturnRequest(id, action);
      fetchReturns();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Return & Recall Requests</h1>
        <p className="text-xs text-slate-400 mt-1">
          {role === 'admin'
            ? 'Process physical inventory return requests submitted by consignment partners'
            : 'Track status of inventory recall requests raised with KickVault HQ'}
        </p>
      </div>

      {/* Returns Table */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Return ID</th>
                <th className="p-3">Shoe Details</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Reason for Return</th>
                <th className="p-3">Request Status</th>
                <th className="p-3">Submitted At</th>
                {role === 'admin' && <th className="p-3 text-right">Action Decision</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Loading return requests...</td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No return requests submitted.</td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{ret.id}</span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      <div>{ret.brand} {ret.model}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {ret.shoeId} | SKU: {ret.sku}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-300">{ret.vendorEmail}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{ret.reason}</td>
                    <td className="p-3">
                      <StatusBadge status={ret.status} />
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(ret.createdAt).toLocaleDateString()}
                    </td>
                    {role === 'admin' && (
                      <td className="p-3 text-right">
                        {ret.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRespond(ret.id, 'approved')}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Return
                            </button>
                            <button
                              onClick={() => handleRespond(ret.id, 'rejected')}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-400 border border-slate-700 text-[11px] transition-colors flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] capitalize">{ret.status}</span>
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
