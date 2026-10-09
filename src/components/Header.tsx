import React from 'react';
import {
  PanelLeft,
  Moon,
  Sun,
  Plus,
  Download,
  Share2
} from 'lucide-react';
import { ChatSession } from '../types';
import { exportSessionToMarkdown, downloadText } from '../utils/exportUtils';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNewChat: () => void;
  activeSession: ChatSession | null;
  onToast: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  theme,
  onToggleTheme,
  onNewChat,
  activeSession,
  onToast,
}) => {
  const handleExportCurrentChat = () => {
    if (!activeSession || activeSession.messages.length === 0) {
      onToast('Belum ada pesan untuk diekspor');
      return;
    }
    const md = exportSessionToMarkdown(activeSession);
    const dateStr = new Date().toISOString().split('T')[0];
    const safeTitle = activeSession.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    downloadText(`adriannus-ai-${safeTitle}-${dateStr}.md`, md, 'text/markdown;charset=utf-8');
    onToast('Percakapan berhasil diunduh sebagai berkas .md');
  };

  const handleShare = () => {
    if (navigator.share && activeSession) {
      navigator
        .share({
          title: 'Adriannus AI - Asisten Pintar',
          text: `Percakapan "${activeSession.title}" via Adriannus AI oleh PT DHAFA TETAP BERUSAHA`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      onToast('Tautan Adriannus AI disalin ke clipboard');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-black/5 dark:border-white/10 bg-[#fbfbfd]/80 dark:bg-[#000000]/80 backdrop-blur-2xl px-4 sm:px-6 transition-colors">
      {/* Left: Sidebar toggle & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Buka / Tutup Histori Chat"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Adriannus AI
          </span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-zinc-400">
            PT DHAFA TETAP BERUSAHA
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="hidden sm:flex items-center space-x-1.5 rounded-full border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all active:scale-95 shadow-xs"
          title="Mulai percakapan baru"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Chat Baru</span>
        </button>

        {/* Export Current Chat (Apple-style download) */}
        {activeSession && activeSession.messages.length > 0 && (
          <button
            onClick={handleExportCurrentChat}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Unduh seluruh percakapan ini (.md)"
          >
            <Download className="h-4 w-4" />
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Bagikan tautan"
        >
          <Share2 className="h-4 w-4" />
        </button>

        {/* Theme Toggle (Sun / Moon) */}
        <button
          onClick={onToggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
};
