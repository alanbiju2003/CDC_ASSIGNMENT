import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Laptop, Check, X, ShieldCheck, Zap } from 'lucide-react';

export default function PwaInstallModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('PWA Download: Tap "Add to Home Screen" or click the Install icon in your browser URL bar.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PWA Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center text-emerald-400 font-black text-2xl">
              KV
            </div>
          </div>
          <h3 className="text-xl font-bold font-heading">KickVault PWA App</h3>
          <p className="text-xs text-slate-400">Downloadable Progressive Web App for Mobile & Desktop</p>
        </div>

        {/* Features List */}
        <div className="space-y-2.5 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>0ms Instant Launch & Home Screen Icon</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Fully Responsive Native-Feel Mobile View</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted Token Offline Storage</span>
          </div>
        </div>

        {/* Action Button */}
        {isInstalled ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>KickVault App is Installed & Active!</span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download & Install KickVault App</span>
          </button>
        )}

        <div className="text-center text-[11px] text-slate-500">
          Compatible with Chrome, Safari (iOS Add to Home Screen), Edge, and Android.
        </div>
      </div>
    </div>
  );
}
