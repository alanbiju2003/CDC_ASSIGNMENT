import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Mail, Shield, Store, LogOut, RefreshCw, Sparkles, UserCheck, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import NotificationDrawer from './NotificationDrawer';
import ChatDrawer from './ChatDrawer';
import EmailDrawer from './EmailDrawer';
import PwaInstallModal from './PwaInstallModal';

export default function Navbar() {
  const { user, role, logout, loginAdmin, loginVendor } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isPwaOpen, setIsPwaOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      if (user) {
        try {
          const res = await API.getNotifications();
          setUnreadNotifs(res.unreadCount || 0);
        } catch (e) {}
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSwitchAccount = async (target) => {
    try {
      if (target === 'admin') {
        await loginAdmin('admin@kickvault.test', 'Passw0rd!');
      } else if (target === 'vendor1') {
        await loginVendor('vendor1@example.test', 'Passw0rd!');
      } else if (target === 'vendor2') {
        await loginVendor('vendor2@example.test', 'Passw0rd!');
      }
      window.location.reload();
    } catch (e) {
      console.error('Failed to switch test account:', e);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center font-bold text-emerald-400 text-lg tracking-tighter">
              KV
            </div>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white tracking-wide flex items-center gap-2 font-heading">
              KICKVAULT
              <span className="hidden sm:inline-block text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30">
                B2B Consignment
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* PWA Download Button */}
          <button
            onClick={() => setIsPwaOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-xs flex items-center gap-1.5 transition"
            title="Download & Install KickVault App (PWA)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 flex items-center justify-center animate-pulse">
                {unreadNotifs}
              </span>
            )}
          </button>

          {/* Chat Trigger */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Vendor ↔ Admin Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Mailbox Drawer Trigger */}
          <button
            onClick={() => setIsEmailOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors relative"
            title="Transactional Email Logs"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Slide-over Drawers & Modals */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <EmailDrawer isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} />
      <PwaInstallModal isOpen={isPwaOpen} onClose={() => setIsPwaOpen(false)} />
    </>
  );
}
