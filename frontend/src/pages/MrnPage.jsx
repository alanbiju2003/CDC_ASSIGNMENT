import React, { useState, useEffect } from 'react';
import { FileCheck, Plus, Download, PenTool, CheckCircle, Clock } from 'lucide-react';
import { API, getAuthToken } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import MrnModal from '../components/MrnModal';

export default function MrnPage() {
  const { user, role } = useAuth();
  const [mrns, setMrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMrn, setSelectedMrn] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const fetchMrns = async () => {
    try {
      setLoading(true);
      const res = await API.getMrns();
      setMrns(res.mrns || []);
    } catch (err) {
      console.error('Error fetching MRNs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMrns();
  }, []);

  const handleDownloadPdf = (mrnId) => {
    const token = getAuthToken();
    window.open(`/api/mrn/${mrnId}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Material Receiving Notes (MRNs)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Official consignment intake receipts requiring digital vendor verification and downloadable PDF proof
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => {
              setSelectedMrn(null);
              setModalMode('create');
              setIsModalOpen(true);
            }}
            className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New MRN</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">MRN Document ID</th>
                <th className="p-3">Vendor Account</th>
                <th className="p-3">Issued By</th>
                <th className="p-3">Items Summary</th>
                <th className="p-3">E-Sign Status</th>
                <th className="p-3">Signed At</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Loading MRN documents...</td>
                </tr>
              ) : mrns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No Material Receiving Notes issued yet.</td>
                </tr>
              ) : (
                mrns.map((mrn) => {
                  let items = [];
                  try {
                    items = typeof mrn.items === 'string' ? JSON.parse(mrn.items) : mrn.items;
                  } catch (e) {
                    items = [];
                  }

                  return (
                    <tr key={mrn.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{mrn.id}</span>
                      </td>
                      <td className="p-3 font-medium">
                        <div>{mrn.vendorName || mrn.vendorEmail}</div>
                        <div className="text-[10px] text-slate-500">{mrn.vendorBusiness}</div>
                      </td>
                      <td className="p-3 text-slate-400">{mrn.createdBy}</td>
                      <td className="p-3">
                        <span className="font-mono text-emerald-400">
                          {items.map((it) => `${it.sku} (${it.qty}x)`).join(', ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={mrn.status} />
                      </td>
                      <td className="p-3 text-slate-400">
                        {mrn.signedAt ? new Date(mrn.signedAt).toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {mrn.status === 'awaiting_signature' && (
                            <button
                              onClick={() => {
                                setSelectedMrn(mrn);
                                setModalMode('sign');
                                setIsModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-colors flex items-center gap-1"
                            >
                              <PenTool className="w-3.5 h-3.5" /> Sign MRN
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPdf(mrn.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] border border-slate-700 transition-colors flex items-center gap-1"
                            title="Download PDF Document"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" /> Download PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MrnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mrn={selectedMrn}
        mode={modalMode}
        onRefresh={fetchMrns}
      />
    </div>
  );
}
