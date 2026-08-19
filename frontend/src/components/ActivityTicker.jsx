import React, { useState, useEffect } from 'react';
import { Activity, Sparkles, TrendingUp, ShieldCheck, FileCheck, Receipt } from 'lucide-react';
import { API } from '../api';

export default function ActivityTicker() {
  const [tickerItems, setTickerItems] = useState([
    { id: 1, type: 'kyc', text: 'KYC Verified: Beta Soles Co (PAN: ZZZZZ9999Z)', time: 'Just now' },
    { id: 2, type: 'shoe', text: 'New Stock Listed: Air Jordan 1 High OG Lost & Found (Size 10.5)', time: '2m ago' },
    { id: 3, type: 'mrn', text: 'MRN Signed: Material Receiving Note #MRN-2491 by Vendor 1', time: '5m ago' },
    { id: 4, type: 'invoice', text: 'Payout Finalized: Invoice #INV-3810 (Net ₹42,500)', time: '12m ago' }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [tickerItems.length]);

  const active = tickerItems[currentIndex];

  return (
    <div className="bg-[#0b0f19] border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs overflow-hidden">
      <div className="flex items-center gap-2 text-emerald-400 font-bold shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="uppercase tracking-wider text-[10px] font-mono">KickVault Live Ops</span>
      </div>

      <div className="flex-1 max-w-2xl mx-4 overflow-hidden text-center">
        <div className="inline-flex items-center gap-2 text-slate-300 font-medium truncate animate-fade-in">
          {active.type === 'kyc' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          {active.type === 'shoe' && <TrendingUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
          {active.type === 'mrn' && <FileCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {active.type === 'invoice' && <Receipt className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
          <span className="truncate">{active.text}</span>
          <span className="text-[10px] text-slate-500 font-mono">({active.time})</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 font-mono shrink-0">
        <span>System Status: </span>
        <span className="text-emerald-400 font-bold">● Operational (v2.4)</span>
      </div>
    </div>
  );
}
