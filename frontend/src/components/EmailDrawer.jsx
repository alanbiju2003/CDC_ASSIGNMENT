import React, { useState, useEffect } from 'react';
import { Mail, X, CheckCircle, FileText, Send, Sparkles } from 'lucide-react';
import { API } from '../api';

export default function EmailDrawer({ isOpen, onClose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await API.getEmails();
      setEmails(res.emails || []);
      if (res.emails && res.emails.length > 0 && !selectedEmail) {
        setSelectedEmail(res.emails[0]);
      }
    } catch (err) {
      console.error('Error fetching email log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#121827] border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">KickVault Mailbox</h3>
                <p className="text-xs text-slate-400">Transactional Email Log & Preview</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mail Content Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 overflow-hidden">
            {/* Email List Sidebar */}
            <div className="md:col-span-2 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-[#0c101d]">
              {loading ? (
                <div className="p-6 text-center text-slate-500 text-xs">Loading mail inbox...</div>
              ) : emails.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">No email messages recorded yet.</div>
              ) : (
                emails.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEmail(e)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedEmail?.id === e.id
                        ? 'bg-slate-800 border-teal-500/50 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-semibold truncate text-white mb-0.5">{e.subject}</div>
                    <div className="text-[10px] text-slate-400 truncate">To: {e.toEmail}</div>
                    <div className="text-[9px] text-slate-500 mt-1">
                      {new Date(e.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Email Body Detail Viewer */}
            <div className="md:col-span-3 overflow-y-auto p-5 space-y-4 bg-[#090d16]">
              {selectedEmail ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">From: <strong className="text-white">{selectedEmail.fromEmail}</strong></span>
                      <span className="text-slate-500 font-mono text-[10px]">{selectedEmail.id}</span>
                    </div>
                    <div className="text-slate-400">To: <strong className="text-emerald-400">{selectedEmail.toEmail}</strong></div>
                    <div className="pt-2 border-t border-slate-800 text-sm font-bold text-white">
                      {selectedEmail.subject}
                    </div>
                  </div>

                  {/* Rendered Email HTML */}
                  <div
                    className="p-2 rounded-xl bg-[#0f172a] border border-slate-800 text-xs"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                  />
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Select an email from the left sidebar to view contents.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
