import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Download,
  PanelLeftClose,
  Sparkles,
  History
} from 'lucide-react';
import { ChatSession } from '../types';
import { exportSessionToMarkdown, downloadText } from '../utils/exportUtils';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  isOpen,
  onClose,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Group sessions by relative date
  const groupedSessions = useMemo(() => {
    const filtered = sessions.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    const groups: { [key: string]: ChatSession[] } = {
      'Hari Ini': [],
      'Kemarin': [],
      '7 Hari Terakhir': [],
      'Sebelumnya': [],
    };

    filtered.forEach((session) => {
      const time = session.updatedAt || session.createdAt;
      if (time >= todayStart) {
        groups['Hari Ini'].push(session);
      } else if (time >= yesterdayStart) {
        groups['Kemarin'].push(session);
      } else if (time >= weekStart) {
        groups['7 Hari Terakhir'].push(session);
      } else {
        groups['Sebelumnya'].push(session);
      }
    });

    return groups;
  }, [sessions, searchQuery]);

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
      onToast('Judul percakapan diperbarui');
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleExportSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const md = exportSessionToMarkdown(session);
    const dateStr = new Date(session.createdAt).toISOString().split('T')[0];
    const safeTitle = session.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    downloadText(`chat-${safeTitle}-${dateStr}.md`, md, 'text/markdown;charset=utf-8');
    onToast('Histori percakapan berhasil diunduh sebagai .md');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-76 sm:w-80 flex-col border-r border-black/5 dark:border-white/10 bg-[#f7f7f9]/90 dark:bg-[#121214]/90 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & New Chat Button */}
        <div className="p-4 border-b border-black/5 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#0071e3] to-[#5ac8fa] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-zinc-200">
                Histori Percakapan
              </span>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* Apple-style "Chat Baru" Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-xs hover:bg-slate-50 dark:hover:bg-white/15 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-[#0071e3] dark:text-[#2997ff]" />
              <span>Obrolan Baru</span>
            </div>
            <kbd className="hidden sm:inline-block rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-zinc-400 bg-slate-100 dark:bg-black/30">
              ⌘N
            </kbd>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari obrolan..."
              className="w-full rounded-lg bg-black/[0.04] dark:bg-white/[0.06] pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 space-y-2">
              <History className="h-7 w-7 mx-auto stroke-1 opacity-40" />
              <p>Belum ada histori obrolan</p>
              <p className="text-[11px] opacity-70">Mulai ketik pertanyaan pertama Anda</p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(([groupTitle, groupItems]) => {
              if (groupItems.length === 0) return null;

              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2.5 py-1 text-[11px] font-medium text-slate-400 dark:text-zinc-500 tracking-wider">
                    {groupTitle}
                  </div>

                  {groupItems.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const isEditing = editingId === session.id;

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          onSelectSession(session.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-white/10 dark:text-white font-medium shadow-xs'
                            : 'text-slate-700 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        {isEditing ? (
                          <form
                            onSubmit={(e) => handleSaveRename(session.id, e)}
                            className="flex flex-1 items-center space-x-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              autoFocus
                              className="flex-1 rounded-md bg-white dark:bg-zinc-800 px-2 py-0.5 text-xs text-slate-800 dark:text-zinc-100 border border-blue-500 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRename}
                              className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              <MessageSquare
                                className={`h-3.5 w-3.5 flex-shrink-0 ${
                                  isActive
                                    ? 'text-[#0071e3] dark:text-[#2997ff]'
                                    : 'text-slate-400 dark:text-zinc-500'
                                }`}
                              />
                              <span className="truncate max-w-[150px] sm:max-w-[170px]" title={session.title}>
                                {session.title}
                              </span>
                            </div>

                            {/* Session Quick Actions */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleExportSession(session, e)}
                                title="Unduh histori obrolan ini"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                              >
                                <Download className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => handleStartRename(session, e)}
                                title="Ganti nama"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                title="Hapus obrolan"
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Panel */}
        <div className="p-3 border-t border-black/5 dark:border-white/5 space-y-2">
          {sessions.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center justify-between rounded-xl bg-rose-50 dark:bg-rose-950/40 p-2 text-xs">
                  <span className="text-rose-600 dark:text-rose-400 font-medium">Hapus semua?</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        onClearAllSessions();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-0.5 rounded bg-rose-600 text-white font-medium hover:bg-rose-700 text-[11px]"
                    >
                      Ya
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[11px]"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex w-full items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Bersihkan Riwayat Chat</span>
                </button>
              )}
            </div>
          )}

          <div className="px-2 py-1 text-[10px] text-slate-400 dark:text-zinc-500 leading-tight">
            PT DHAFA TETAP BERUSAHA • Versi 2.0
          </div>
        </div>
      </aside>
    </>
  );
};
