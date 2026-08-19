import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ChatDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const [selectedVendor, setSelectedVendor] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // If user is vendor, selectedVendor is their own email. If admin, default to vendor1@example.test
  useEffect(() => {
    if (user) {
      if (user.role === 'vendor') {
        setSelectedVendor(user.email);
      } else if (!selectedVendor) {
        setSelectedVendor('vendor1@example.test');
      }
    }
  }, [user]);

  const loadMessages = async () => {
    if (!selectedVendor) return;
    try {
      setLoading(true);
      const res = await API.getChatMessages(selectedVendor);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedVendor) {
      loadMessages();
      const interval = setInterval(loadMessages, 2500); // 2.5s poll for snappy real-time messaging
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedVendor]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedVendor) return;

    const messageContent = text;
    setText('');
    try {
      await API.sendChatMessage(selectedVendor, messageContent);
      await loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#121827] border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">KickVault Live Chat</h3>
                <p className="text-xs text-slate-400">Direct Vendor ↔ Admin Messenger</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Vendor Selector */}
          {user?.role === 'admin' && (
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0 font-medium">Select Thread:</span>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="vendor1@example.test">Vendor One (Alpha Kicks Co)</option>
                <option value="vendor2@example.test">Vendor Two (Beta Soles Co)</option>
              </select>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0b0f19]">
            {loading && messages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No messages yet. Send a note to start the conversation!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderEmail === user?.email;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {m.senderRole === 'admin' ? '🛡️ Admin' : `👟 ${m.senderEmail.split('@')[0]}`}
                      </span>
                      <span className="text-[9px] text-slate-600">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-tr-none'
                          : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-[#0f172a] flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
