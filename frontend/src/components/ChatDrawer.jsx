import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User } from 'lucide-react';
import { io } from 'socket.io-client';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ChatDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const [selectedVendor, setSelectedVendor] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Default vendor for Admin vs Vendor
  useEffect(() => {
    if (user) {
      if (user.role === 'vendor') {
        setSelectedVendor(user.email);
      } else if (!selectedVendor) {
        setSelectedVendor('vendor1@example.test');
      }
    }
  }, [user]);

  // Load chat messages (silent flag prevents spinner on auto-sync)
  const fetchMessages = async (silent = false) => {
    if (!selectedVendor) return;
    try {
      if (!silent) setLoading(true);
      const res = await API.getChatMessages(selectedVendor);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Socket.io WebSocket Connection for Instant Push
  useEffect(() => {
    const socketUrl = window.location.origin.includes('localhost') ? 'http://localhost:5001' : window.location.origin;
    socketRef.current = io(socketUrl);

    socketRef.current.on('chat:message', (newMsg) => {
      if (newMsg && newMsg.vendorId === selectedVendor) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [selectedVendor]);

  // Initial load + Silent 2s background polling fallback
  useEffect(() => {
    if (isOpen && selectedVendor) {
      fetchMessages(false);
      const interval = setInterval(() => fetchMessages(true), 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedVendor]);

  // Smooth auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedVendor) return;

    const messageContent = text;
    setText('');
    try {
      const res = await API.sendChatMessage(selectedVendor, messageContent);
      if (res?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message.id)) return prev;
          return [...prev, res.message];
        });
      } else {
        await fetchMessages(true);
      }
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
                <p className="text-xs text-slate-400">Instant WebSocket Messenger ⚡</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Vendor Switcher Dropdown */}
          {user?.role === 'admin' && (
            <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Select Thread:</span>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-violet-500"
              >
                <option value="vendor1@example.test">Vendor One (Alpha Kicks Co)</option>
                <option value="vendor2@example.test">Vendor Two (Beta Soles)</option>
                <option value="alanthomasbiju01@gmail.com">Alan Thomas Biju (KickVault HQ)</option>
              </select>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Loading live chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No chat history yet. Send a message to start direct communication.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderEmail === user?.email;
                const isAdminMsg = msg.senderRole === 'admin';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">
                        {isAdminMsg ? '🛡️ Admin' : `🏷️ ${msg.senderEmail.split('@')[0]}`}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-lg shadow-emerald-950/20'
                          : isAdminMsg
                          ? 'bg-emerald-900/60 text-emerald-100 border border-emerald-500/30 rounded-bl-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-[#0f172a] flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-emerald-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
