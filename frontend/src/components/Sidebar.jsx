import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FileCheck, Receipt, ArrowUpDown, RotateCcw, Wallet, ShieldCheck, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, role } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Consignment Inventory', icon: Package },
    { to: '/mrns', label: 'MRN Notes', icon: FileCheck },
    { to: '/invoices', label: 'Invoices', icon: Receipt },
    { to: '/price-requests', label: 'Price Requests', icon: ArrowUpDown },
    { to: '/returns', label: 'Return Requests', icon: RotateCcw },
    { to: '/payments', label: 'Payment Summary', icon: Wallet },
  ];

  if (role === 'vendor') {
    links.push({ to: '/kyc', label: 'KYC Verification', icon: ShieldCheck });
  } else if (role === 'admin') {
    links.push({ to: '/admin/kyc', label: 'KYC Approvals Queue', icon: ShieldCheck });
  }

  return (
    <>
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-[#0c101d] border-r border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Role Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${role === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Portal Mode</span>
              <span className="text-sm font-bold text-slate-100 truncate block">
                {role === 'admin' ? 'Administrator HQ' : 'Vendor Portal'}
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            <div className="px-3 mb-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">Navigation</div>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-200 truncate">{user?.name || user?.email}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.businessName || user?.role}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Bar (Shown on Mobile) */}
      <div className="md:hidden bg-[#0c101d] border-b border-slate-800 p-2.5 overflow-x-auto flex items-center gap-2 scrollbar-none sticky top-16 z-30">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                    : 'bg-slate-900/90 text-slate-400 border border-slate-800'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </>
  );
}
