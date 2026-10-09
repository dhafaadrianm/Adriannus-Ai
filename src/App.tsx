import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Landmark,
  Compass,
  Briefcase,
  Code2,
  Printer,
  Youtube,
  Lightbulb,
  Paintbrush,
  Image as ImageIcon,
  X,
  Download,
  Maximize2
} from 'lucide-react';
import { Message, ChatSession, AttachedFile } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { PrivacyModal } from './components/PrivacyModal';

const STORAGE_KEY = 'adriannus_chat_sessions_v3';
const ACTIVE_SESSION_KEY = 'adriannus_active_session_id_v3';
const THEME_KEY = 'adriannus_theme_v3';

const DYNAMIC_SUBTITLES = [
  'Terus belajar & belajar',
  'Siap membaca foto & membuat karya seni',
  'Presisi, elegan & responsif',
  'Inovasi dari PT DHAFA TETAP BERUSAHA'
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
  });

  // Dynamic subtitle cycling
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(1);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_SESSION_KEY) || null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lightbox for full-size image viewing
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Apply theme to html root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Save active session id
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [activeSessionId]);

  // Subtitle cycle animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleOpacity(0);
      setTimeout(() => {
        setSubtitleIndex((prev) => (prev + 1) % DYNAMIC_SUBTITLES.length);
        setSubtitleOpacity(1);
      }, 350);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + N for new chat
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Toast auto-dismiss
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Active session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeSessionId]);

  // Create new chat
  const handleNewChat = () => {
    setActiveSessionId(null);
    showToast('Obrolan baru siap');
  };

  // Delete single session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
    showToast('Sesi obrolan dihapus');
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    setSessions([]);
    setActiveSessionId(null);
    showToast('Seluruh riwayat obrolan telah dibersihkan');
  };

  // Send message with optional image attachment and image generation flag
  const handleSendMessage = async (
    text: string,
    attachedImage?: AttachedFile,
    isGenerateImage = false
  ) => {
    if ((!text.trim() && !attachedImage) || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      imageUrl: attachedImage ? attachedImage.previewUrl : undefined,
    };

    let currentSession = activeSession;
    let updatedSessions = [...sessions];

    const titleCandidate = text.trim() || (attachedImage ? `Analisis Gambar: ${attachedImage.name}` : 'Obrolan');

    if (!currentSession) {
      // Create new session
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: titleCandidate.length > 36 ? titleCandidate.slice(0, 36) + '...' : titleCandidate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage],
      };
      updatedSessions = [newSession, ...updatedSessions];
      setSessions(updatedSessions);
      setActiveSessionId(newSession.id);
      currentSession = newSession;
    } else {
      // Append to active session
      const updatedSession: ChatSession = {
        ...currentSession,
        updatedAt: Date.now(),
        messages: [...currentSession.messages, userMessage],
      };
      updatedSessions = updatedSessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
      setSessions(updatedSessions);
      currentSession = updatedSession;
    }

    setIsLoading(true);
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      // Prepare history payload (text-only)
      const historyPayload = currentSession.messages
        .filter((m) => m.content)
        .map((m) => ({
          role: m.role,
          text: m.content,
        }));

      const bodyPayload: any = {
        message: text,
        history: historyPayload,
      };

      if (attachedImage) {
        bodyPayload.image = {
          data: attachedImage.data,
          mimeType: attachedImage.mimeType,
        };
      }

      if (isGenerateImage) {
        bodyPayload.generateImageRequest = true;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        throw new Error('Gagal memproses respons dari server');
      }

      const data = await res.json();
      const replyText =
        data.reply ||
        'Maaf, terjadi kendala saat memproses jawaban. Silakan coba kembali.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.';

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        role: 'assistant',
        content: replyText,
        timestamp: Date.now(),
        imageUrl: data.imageUrl,
        isGeneratedImage: data.isGeneratedImage,
        imagePrompt: data.imagePrompt,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession!.id
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: [...s.messages, assistantMessage],
              }
            : s
        )
      );

      if (data.isGeneratedImage) {
        showToast('Gambar berhasil dibuat oleh Adriannus AI!');
      }
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        role: 'assistant',
        content:
          'Maaf, koneksi ke server sedang mengalami kendala. Silakan periksa jaringan dan coba lagi.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.',
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession!.id
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        )
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fbfbfd] text-slate-900 dark:bg-[#000000] dark:text-[#f5f5f7] transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 rounded-full border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#1a1a1e]/90 backdrop-blur-xl px-4 py-2 text-xs font-medium text-slate-800 dark:text-zinc-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="h-3.5 w-3.5 text-[#0071e3] dark:text-[#2997ff]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Chat History Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToast={showToast}
      />

      {/* Main Chat Workspace */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Apple Sleek Top Bar */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onNewChat={handleNewChat}
          activeSession={activeSession}
          onToast={showToast}
        />

        {/* Scrollable Conversation Stream */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Welcome Screen if no messages yet */}
            {(!activeSession || activeSession.messages.length === 0) && (
              <div className="py-8 sm:py-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                {/* Brand Badge */}
                <div className="mb-4 inline-flex items-center space-x-2 rounded-full border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.06] px-3.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>PT DHAFA TETAP BERUSAHA</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Adriannus AI
                </h1>

                {/* Dynamic cycling subtitle */}
                <p
                  className="mt-2.5 text-base sm:text-lg font-normal text-slate-500 dark:text-zinc-400 transition-opacity duration-300 min-h-[28px]"
                  style={{ opacity: subtitleOpacity }}
                >
                  {DYNAMIC_SUBTITLES[subtitleIndex]}
                </p>

                <div className="mt-1 text-xs text-slate-400 dark:text-zinc-500 max-w-md">
                  Adriannus AI mampu membaca gambar, menghasilkan karya seni digital, konsultasi bisnis, dan menjawab pertanyaan dengan presisi tinggi.
                </div>

                {/* Suggestions Grid */}
                <div className="mt-8 grid w-full grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl text-left">
                  {/* Buat Gambar AI */}
                  <div
                    onClick={() =>
                      handleSendMessage(
                        'Buatkan gambar mobil balap futuristik bernuansa cyberpunk neon malam hari',
                        undefined,
                        true
                      )
                    }
                    className="apple-card group rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-black/15 dark:hover:border-white/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                        <Paintbrush className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-[#0071e3] dark:group-hover:text-[#2997ff] transition-colors">
                          🎨 Buat Gambar AI
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Mobil balap futuristik cyberpunk
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Topik Politik */}
                  <div
                    onClick={() => handleSendMessage('Bagaimana analisis dinamika politik dan kebijakan publik terkini di Indonesia dan global?')}
                    className="apple-card group rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-black/15 dark:hover:border-white/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-[#0071e3] dark:group-hover:text-[#2997ff] transition-colors">
                          🏛️ Politik & Isu Publik
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Analisis kebijakan & dinamika terkini
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ide Bisnis & Kreatif */}
                  <div
                    onClick={() => handleSendMessage('Bagikan ide bisnis kreatif yang potensial dan strategi meningkatkan produktivitas harian')}
                    className="apple-card group rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-black/15 dark:hover:border-white/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-[#0071e3] dark:group-hover:text-[#2997ff] transition-colors">
                          💡 Ide Bisnis & Kreatif
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Inovasi usaha & produktivitas kerja
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Topik Travelling */}
                  <div
                    onClick={() =>
                      handleSendMessage(
                        'Berikan rekomendasi destinasi travelling terindah dan tips perjalanan liburan seru'
                      )
                    }
                    className="apple-card group rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-black/15 dark:hover:border-white/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Compass className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-[#0071e3] dark:group-hover:text-[#2997ff] transition-colors">
                          ✈️ Travelling & Wisata
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Destinasi liburan & rekomendasi seru
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {activeSession &&
              activeSession.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onToast={showToast}
                  onImageClick={(url) => setActiveLightboxImage(url)}
                />
              ))}

            {/* Thinking / Loading indicator */}
            {isLoading && (
              <div className="apple-card rounded-2xl p-4 sm:p-5 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-7 w-7 rounded-xl bg-blue-500/20 text-[#0071e3] dark:text-[#2997ff] flex items-center justify-center">
                    <Sparkles className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-36 rounded bg-black/10 dark:bg-white/10" />
                    <div className="h-3 w-64 rounded bg-black/5 dark:bg-white/5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pinned Bottom Input Command Dock */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onToast={showToast}
        />
      </div>

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeLightboxImage}
              alt="Tampilan Gambar Penuh"
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center space-x-2">
              <a
                href={activeLightboxImage}
                download={`adriannus-ai-${Date.now()}.png`}
                className="flex items-center space-x-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Gambar</span>
              </a>
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="flex items-center space-x-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white transition-all"
              >
                <X className="h-4 w-4" />
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
