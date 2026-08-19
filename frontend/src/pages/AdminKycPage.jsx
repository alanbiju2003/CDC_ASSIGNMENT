import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Clock, FileText, AlertTriangle, Eye, CheckCircle2, UserCheck } from 'lucide-react';
import { API } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function AdminKycPage() {
  const [records, setRecords] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await API.getAdminKycQueue();
      setRecords(res.records || []);
      setPendingCount(res.pendingCount || 0);
    } catch (err) {
      console.error('Error fetching KYC queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (recordId) => {
    try {
      setActionLoading(true);
      await API.respondAdminKyc(recordId, 'approved');
      await fetchQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setActionLoading(true);
      await API.respondAdminKyc(selectedRecord.id, 'rejected', rejectionReason);
      setIsRejectModalOpen(false);
      setSelectedRecord(null);
      setRejectionReason('');
      await fetchQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Admin KYC Compliance Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review vendor tax identity submissions, inspect proof documents, and approve vendor account activations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {pendingCount} Pending Verification
          </span>
        </div>
      </div>

      {/* Queue List */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Vendor / Store</th>
                <th className="p-3">PAN Number</th>
                <th className="p-3">Entity Category</th>
                <th className="p-3">GSTIN Number</th>
                <th className="p-3">Attached Proof</th>
                <th className="p-3">Audit Score</th>
                <th className="p-3">KYC Status</th>
                <th className="p-3 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading KYC queue...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">No vendor KYC applications submitted yet.</td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-medium">
                      <div className="font-bold text-white">{rec.vendorName || rec.userEmail}</div>
                      <div className="text-[10px] text-slate-400">{rec.businessName || 'Store'}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400 text-sm">{rec.pan}</td>
                    <td className="p-3 text-slate-300">{rec.entityType || 'Business Entity'}</td>
                    <td className="p-3 font-mono text-slate-400">{rec.gstin || 'N/A'}</td>
                    <td className="p-3 font-mono text-xs text-slate-300 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rec.fileName || 'pan_proof.pdf'}</span>
                    </td>
                    <td className="p-3 font-bold text-amber-400">{rec.confidenceScore || 98}%</td>
                    <td className="p-3">
                      <StatusBadge status={rec.status === 'approved' ? 'live' : rec.status === 'pending_approval' ? 'submitted' : 'returned'} />
                    </td>
                    <td className="p-3 text-right">
                      {rec.status === 'pending_approval' || rec.status === 'submitted' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(rec.id)}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve & Activate
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRecord(rec);
                              setIsRejectModalOpen(true);
                            }}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-400 border border-slate-700 text-[11px] transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] capitalize font-medium">
                          {rec.status === 'approved' ? `Approved by ${rec.approvedBy || 'Admin'}` : `Rejected: ${rec.rejectionReason}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-100">
            <h3 className="font-bold text-base font-heading">Reject Vendor KYC Submission</h3>
            <p className="text-xs text-slate-400">
              Provide a clear reason for rejecting the PAN submission for {selectedRecord?.vendorName} ({selectedRecord?.pan}).
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document copy unreadable or name mismatch..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
