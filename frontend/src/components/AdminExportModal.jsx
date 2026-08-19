import React, { useState } from 'react';
import { Download, FileSpreadsheet, Database, ShieldCheck, Check, Sparkles, X, Archive } from 'lucide-react';
import { API } from '../api';

export default function AdminExportModal({ isOpen, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFullBackupExport = async () => {
    try {
      setExporting(true);
      setDownloadSuccess(false);

      const [shoesRes, mrnRes, invRes, kycRes, emailRes] = await Promise.all([
        API.getShoes(),
        API.getMrns(),
        API.getInvoices(),
        API.getAdminKycQueue(),
        API.getEmails()
      ]);

      const auditBundle = {
        exportedAt: new Date().toISOString(),
        exportedBy: 'admin@kickvault.test',
        platformVersion: 'v2.4-enterprise',
        inventoryCount: shoesRes.shoes?.length || 0,
        inventory: shoesRes.shoes || [],
        mrns: mrnRes.mrns || [],
        invoices: invRes.invoices || [],
        kycRecords: kycRes.records || [],
        emailLogs: emailRes.emails || []
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditBundle, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `KickVault_Audit_Backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setDownloadSuccess(true);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleInventoryCsvExport = async () => {
    try {
      setExporting(true);
      const res = await API.getShoes();
      const shoes = res.shoes || [];

      let csv = 'ID,Vendor,Brand,Model,Size,SKU,Condition,AskingPrice,AdminPrice,Qty,SoldQty,Status,CreatedAt\n';
      shoes.forEach(s => {
        csv += `"${s.id}","${s.vendorEmail}","${s.brand}","${s.model}","${s.size}","${s.sku}","${s.condition}",${s.askingPrice},${s.adminPrice || 0},${s.qty},${s.soldQty},"${s.status}","${s.createdAt}"\n`;
      });

      const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `KickVault_Consignment_Inventory_${Date.now()}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setDownloadSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121827] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 text-slate-100 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-heading">Enterprise Audit & Data Export</h3>
              <p className="text-xs text-slate-400">Export structured platform records & consignment logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> Audit package generated and downloaded successfully!
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleFullBackupExport}
            disabled={exporting}
            className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 text-left transition-all group flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="font-bold text-xs text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-400" /> Full System JSON Audit Bundle
              </div>
              <p className="text-[11px] text-slate-400">Exports Inventory, MRNs, Invoices, KYC Records, and Mail Logs</p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors shrink-0" />
          </button>

          <button
            onClick={handleInventoryCsvExport}
            disabled={exporting}
            className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="font-bold text-xs text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Consignment Inventory CSV Report
              </div>
              <p className="text-[11px] text-slate-400">Exports formatted inventory spreadsheet with asking prices & stock</p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
