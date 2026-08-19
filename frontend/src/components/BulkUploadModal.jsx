import React, { useState } from 'react';
import { X, UploadCloud, FileText, Check, AlertCircle } from 'lucide-react';
import { API } from '../api';

export default function BulkUploadModal({ isOpen, onClose, onRefresh }) {
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          setParsedData(Array.isArray(json) ? json : [json]);
        } else {
          // Parse CSV
          const lines = text.trim().split('\n');
          if (lines.length < 2) {
            setError('CSV file must contain a header row and at least one data row.');
            return;
          }
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const rows = [];

          for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(',').map(c => c.trim());
            if (cells.length < 3) continue;

            const item = {};
            headers.forEach((h, idx) => {
              item[h] = cells[idx] || '';
            });

            rows.push({
              brand: item.brand || 'Nike',
              model: item.model || 'Sneaker',
              size: item.size || 'US 9',
              sku: item.sku || `SKU-${Date.now()}-${i}`,
              condition: item.condition || 'New',
              askingPrice: Number(item.askingprice || item.asking_price || item.price || 15000),
              qty: parseInt(item.qty || item.quantity || 1, 10)
            });
          }
          setParsedData(rows);
        }
      } catch (err) {
        setError('Failed to parse file. Please verify CSV or JSON formatting.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setError('');

    try {
      await API.bulkCreateShoes(parsedData);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Bulk upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121827] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100">
        <div className="p-5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Bulk Upload Consignment Listings</h3>
              <p className="text-xs text-slate-400">Upload CSV or JSON file containing sneaker inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-slate-900/50 transition-colors relative">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
              <div className="p-3 rounded-full bg-slate-800 text-emerald-400 mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {fileName ? fileName : 'Click or Drag CSV / JSON file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Expected columns: brand, model, size, sku, condition, askingprice, qty</p>
            </div>
          </div>

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Preview ({parsedData.length} Items Found)</span>
                <span className="text-xs text-emerald-400 font-medium">Ready to upload</span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400">
                    <tr>
                      <th className="p-2">Brand</th>
                      <th className="p-2">Model</th>
                      <th className="p-2">SKU</th>
                      <th className="p-2">Size</th>
                      <th className="p-2">Asking Price</th>
                      <th className="p-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {parsedData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2">{row.brand}</td>
                        <td className="p-2">{row.model}</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">{row.sku}</td>
                        <td className="p-2">{row.size}</td>
                        <td className="p-2">₹{row.askingPrice}</td>
                        <td className="p-2">{row.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              const sample = `brand,model,size,sku,condition,askingprice,qty\nNike,Dunk Low Panda,US 10,DNK-PND-10,New,12999,2\nTravis Scott,Air Jordan 1 Low Reverse Mocha,US 9.5,TS-RM-95,New,89999,1`;
              const blob = new Blob([sample], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'kickvault_sample_inventory.csv';
              a.click();
            }}
            className="text-xs text-slate-400 hover:text-emerald-400 font-medium underline"
          >
            Download Sample CSV Template
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || parsedData.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Importing...' : `Import ${parsedData.length} Listings`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
