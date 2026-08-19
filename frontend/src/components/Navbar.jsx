import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Mail, Shield, Store, LogOut, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import NotificationDrawer from './NotificationDrawer';
import ChatDrawer from './ChatDrawer';
import EmailDrawer from './EmailDrawer';

export default function Navbar() {
  const { user, role, logout, loginAdmin, loginVendor } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
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
      <header className="h-16 border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center font-bold text-emerald-400 text-lg tracking-tighter">
              KV
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2 font-heading">
              KICKVAULT
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30">
                B2B Consignment
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Switcher for Reviewers */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Switch Test User:
            </span>
            <button
              onClick={() => handleSwitchAccount('admin')}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1 ${
                user?.email === 'admin@kickvault.test'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-3 h-3" /> Admin
            </button>
            <button
              onClick={() => handleSwitchAccount('vendor1')}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1 ${
                user?.email === 'vendor1@example.test'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Store className="w-3 h-3" /> Vendor 1 (Active)
            </button>
            <button
              onClick={() => handleSwitchAccount('vendor2')}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1 ${
                user?.email === 'vendor2@example.test'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-3 h-3" /> Vendor 2 (Pending KYC)
            </button>
          </div>

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
            title="Vendor Chat"
          >
            <MessageSquare className="w-4 h-4 text-violet-400" />
          </button>

          {/* Transactional Mailbox Trigger */}
          <button
            onClick={() => setIsEmailOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="KickVault Mailbox"
          >
            <Mail className="w-4 h-4 text-teal-400" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user?.name || user?.email}</div>
              <div className="text-[10px] text-slate-400 capitalize flex items-center justify-end gap-1">
                {role === 'admin' ? (
                  <span className="text-violet-400 font-semibold flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" /> Admin HQ
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Store className="w-2.5 h-2.5" /> {user?.businessName || 'Vendor'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Slideout Drawers */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <EmailDrawer isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} />
    </>
  );
}
