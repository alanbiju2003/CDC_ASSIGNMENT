import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Download, Send, XCircle, CheckCircle } from 'lucide-react';
import { API, getAuthToken } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import InvoiceModal from '../components/InvoiceModal';

export default function InvoicePage() {
  const { user, role } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await API.getInvoices();
      setInvoices(res.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSend = async (id) => {
    try {
      await API.sendInvoice(id);
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.cancelInvoice(id);
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = (invId) => {
    const token = getAuthToken();
    window.open(`/api/invoices/${invId}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Consignment Invoices</h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate and track vendor settlement invoices with commission breakdowns and PDF exports
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-violet px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Invoice ID</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Sold Line Items</th>
                <th className="p-3">Gross Total</th>
                <th className="p-3">Commission %</th>
                <th className="p-3">Net Payout</th>
                <th className="p-3">Lifecycle Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">No consignment invoices generated yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  let lines = [];
                  try {
                    lines = typeof inv.lines === 'string' ? JSON.parse(inv.lines) : inv.lines;
                  } catch (e) {
                    lines = [];
                  }

                  const gross = lines.reduce((acc, l) => acc + (l.qtySold * l.unitPrice), 0);
                  const commissionVal = Math.round((gross * inv.commissionPct) / 100);
                  const net = gross - commissionVal;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-violet-400 shrink-0" />
                        <span>{inv.id}</span>
                      </td>
                      <td className="p-3 font-medium">
                        <div>{inv.vendorName || inv.vendorEmail}</div>
                        <div className="text-[10px] text-slate-500">{inv.vendorBusiness}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-slate-300">
                          {lines.map((l) => `${l.sku} (${l.qtySold}x @ ₹${l.unitPrice})`).join(', ')}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        ₹{gross.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-amber-400 font-semibold">{inv.commissionPct}%</td>
                      <td className="p-3 font-bold text-emerald-400">
                        ₹{net.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {role === 'admin' && inv.status === 'draft' && (
                            <button
                              onClick={() => handleSend(inv.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] transition-colors flex items-center gap-1"
                              title="Mark as SENT"
                            >
                              <Send className="w-3 h-3" /> Issue & Send
                            </button>
                          )}
                          {role === 'admin' && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancel(inv.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-[11px] transition-colors"
                              title="Cancel Invoice"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPdf(inv.id)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] border border-slate-700 transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3 text-violet-400" /> PDF
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

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchInvoices}
      />
    </div>
  );
}
