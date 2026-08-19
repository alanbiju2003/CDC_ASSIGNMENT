import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus, UploadCloud, Edit3, DollarSign, RefreshCw, RotateCcw, ArrowUpDown, Calculator, Archive } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ShoeModal from '../components/ShoeModal';
import BulkUploadModal from '../components/BulkUploadModal';
import PriceRequestModal from '../components/PriceRequestModal';
import ReturnRequestModal from '../components/ReturnRequestModal';
import PricingCalculatorModal from '../components/PricingCalculatorModal';
import AdminExportModal from '../components/AdminExportModal';

export default function InventoryPage() {
  const { user, role } = useAuth();
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedShoe, setSelectedShoe] = useState(null);
  const [isPriceReqOpen, setIsPriceReqOpen] = useState(false);
  const [isReturnReqOpen, setIsReturnReqOpen] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await API.getShoes();
      setShoes(res.shoes || []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredShoes = shoes.filter((s) => {
    const matchesSearch =
      s.brand.toLowerCase().includes(search.toLowerCase()) ||
      s.model.toLowerCase().includes(search.toLowerCase()) ||
      s.sku.toLowerCase().includes(search.toLowerCase()) ||
      (s.vendorEmail && s.vendorEmail.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">Consignment Inventory</h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'admin'
              ? 'Review vendor listings, set approved admin pricing, and manage inventory statuses'
              : 'List, manage, and request price changes for your consignment sneakers'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setIsCalcOpen(true)}
            className="btn-secondary px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="Calculator"
          >
            <Calculator className="w-4 h-4 text-teal-400" />
            <span>Payout Estimator</span>
          </button>

          {role === 'admin' && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600/20 text-violet-300 border border-violet-500/40 hover:bg-violet-600/30 transition-colors flex items-center gap-1.5"
            >
              <Archive className="w-4 h-4" />
              <span>Export Audit Data</span>
            </button>
          )}

          {role === 'vendor' && (
            <>
              <button
                onClick={() => setIsBulkOpen(true)}
                className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 text-slate-300" />
                <span>Bulk CSV / JSON</span>
              </button>
              <button
                onClick={() => {
                  setSelectedShoe(null);
                  setIsAddOpen(true);
                }}
                className="btn-emerald px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>List Sneaker</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121827] p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, model, SKU, or vendor..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="submitted">Submitted (Under Review)</option>
            <option value="priced">Priced</option>
            <option value="live">Live on Vault</option>
            <option value="sold">Sold</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">ID / SKU</th>
                <th className="p-3">Sneaker Description</th>
                <th className="p-3">Size & Condition</th>
                {role === 'admin' && <th className="p-3">Vendor</th>}
                <th className="p-3">Asking Price</th>
                <th className="p-3">Admin Price</th>
                <th className="p-3">Qty (Stock / Sold)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">Loading consignment inventory...</td>
                </tr>
              ) : filteredShoes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500">No sneaker listings matched your filter criteria.</td>
                </tr>
              ) : (
                filteredShoes.map((shoe) => (
                  <tr key={shoe.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono">
                      <span className="text-white font-bold block">{shoe.id}</span>
                      <span className="text-[10px] text-slate-500">{shoe.sku}</span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      <div>{shoe.brand} {shoe.model}</div>
                      <div className="text-[10px] font-normal text-slate-400">Listed: {new Date(shoe.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{shoe.size}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{shoe.condition}</span>
                    </td>
                    {role === 'admin' && (
                      <td className="p-3 text-slate-300 font-medium">
                        <div>{shoe.vendorName || shoe.vendorEmail}</div>
                        <div className="text-[10px] text-slate-500">{shoe.vendorBusiness}</div>
                      </td>
                    )}
                    <td className="p-3 font-semibold text-slate-200">
                      ₹{shoe.askingPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      {shoe.adminPrice ? `₹${shoe.adminPrice.toLocaleString('en-IN')}` : 'Pending'}
                    </td>
                    <td className="p-3 font-medium">
                      <span>{shoe.qty} in stock</span>
                      {shoe.soldQty > 0 && (
                        <span className="text-purple-400 block text-[10px] font-semibold">{shoe.soldQty} sold</span>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={shoe.status} />
                    </td>
                    <td className="p-3 text-right">
                      {role === 'admin' ? (
                        <button
                          onClick={() => {
                            setSelectedShoe(shoe);
                            setIsAddOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 ml-auto"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Price / Status
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedShoe(shoe);
                              setIsPriceReqOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-[11px] border border-slate-700 transition-colors flex items-center gap-1"
                            title="Request Price Change"
                          >
                            <ArrowUpDown className="w-3 h-3" /> Reprice
                          </button>
                          <button
                            onClick={() => {
                              setSelectedShoe(shoe);
                              setIsReturnReqOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium text-[11px] border border-slate-700 transition-colors flex items-center gap-1"
                            title="Request Return"
                          >
                            <RotateCcw className="w-3 h-3" /> Return
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ShoeModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setSelectedShoe(null);
        }}
        shoe={selectedShoe}
        onRefresh={fetchInventory}
      />
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onRefresh={fetchInventory}
      />
      <PriceRequestModal
        isOpen={isPriceReqOpen}
        onClose={() => {
          setIsPriceReqOpen(false);
          setSelectedShoe(null);
        }}
        shoe={selectedShoe}
        onRefresh={fetchInventory}
      />
      <ReturnRequestModal
        isOpen={isReturnReqOpen}
        onClose={() => {
          setIsReturnReqOpen(false);
          setSelectedShoe(null);
        }}
        shoe={selectedShoe}
        onRefresh={fetchInventory}
      />
      <PricingCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
      />
      <AdminExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
