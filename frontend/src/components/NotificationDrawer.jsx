import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { API } from '../api';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await API.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const handleMarkRead = async (id) => {
    try {
      await API.markNotificationRead(id);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.markAllNotificationsRead();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#121827] border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Notifications</h3>
                <p className="text-xs text-slate-400">{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded hover:bg-slate-800"
                >
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No notifications yet.</div>
            ) : (
              notifications.map((n) => {
                let TypeIcon = Info;
                let iconColor = 'text-blue-400 bg-blue-500/10';
                if (n.type === 'success') {
                  TypeIcon = CheckCircle;
                  iconColor = 'text-emerald-400 bg-emerald-500/10';
                } else if (n.type === 'warning') {
                  TypeIcon = AlertTriangle;
                  iconColor = 'text-amber-400 bg-amber-500/10';
                }

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      n.read
                        ? 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                        : 'bg-slate-800/80 border-slate-700 text-white font-medium shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${iconColor}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold truncate">{n.title}</h4>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
