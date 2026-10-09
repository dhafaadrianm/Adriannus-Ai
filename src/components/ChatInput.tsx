import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Mic,
  MicOff,
  Plus,
  Landmark,
  Compass,
  Shirt,
  Utensils,
  Briefcase,
  Printer,
  Youtube,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  X,
  Paintbrush
} from 'lucide-react';
import { AttachedFile } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachedImage?: AttachedFile, isGenerateImage?: boolean) => void;
  isLoading: boolean;
  onOpenPrivacy: () => void;
  onToast: (msg: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onOpenPrivacy,
  onToast,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<AttachedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [inputVal]);

  // Handle clipboard paste (images)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          processImageFile(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Web Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputVal((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
      };

      recognition.onerror = () => {
        setIsListening(false);
        onToast('Perekam suara dinonaktifkan atau izin mikrofon ditolak');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onToast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      onToast('Pengenalan suara tidak didukung di peramban ini');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      onToast('Perekaman suara selesai');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        onToast('Mendengarkan suara Anda...');
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onToast('Mohon unggah berkas gambar (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      onToast('Ukuran gambar maksimal 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const base64Data = result.split(',')[1];
        setAttachedImage({
          data: base64Data,
          mimeType: file.type || 'image/jpeg',
          previewUrl: result,
          name: file.name,
        });
        onToast(`Gambar "${file.name}" siap dianalisis`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleSend = () => {
    if ((!inputVal.trim() && !attachedImage) || isLoading) return;

    const textToSend = inputVal.trim();
    const imageToSend = attachedImage || undefined;

    setInputVal('');
    setAttachedImage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    onSendMessage(textToSend, imageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectQuickPrompt = (prompt: string, isGenImage = false) => {
    setShowQuickMenu(false);
    if (isGenImage) {
      onSendMessage(prompt, undefined, true);
    } else {
      setInputVal(prompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  return (
    <div
      className="sticky bottom-0 z-30 w-full px-3 pb-3 sm:pb-5 pt-2 bg-gradient-to-t from-[#fbfbfd] via-[#fbfbfd]/95 to-transparent dark:from-[#09090b] dark:via-[#09090b]/95 dark:to-transparent"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processImageFile(e.dataTransfer.files[0]);
        }
      }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Quick Menu Popover */}
        {showQuickMenu && (
          <div
            className="mb-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1c1c20]/95 backdrop-blur-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Pintasan & Kreasi Adriannus AI
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
              {/* Buat Gambar AI */}
              <button
                onClick={() => selectQuickPrompt('Buatkan gambar mobil sport futuristik dengan latar kota neon cyber di malam hari', true)}
                className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
              >
                <div className="p-1 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Paintbrush className="h-3.5 w-3.5" />
                </div>
                <span>🎨 Buatkan Gambar: Mobil Futuristik</span>
              </button>

              {/* Topik Politik */}
              <button
                onClick={() => selectQuickPrompt('Bagaimana perkembangan berita politik dan isu kebijakan terkini?')}
                className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
              >
                <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Landmark className="h-3.5 w-3.5" />
                </div>
                <span>🏛️ Politik & Isu Terkini</span>
              </button>

              {/* Topik Travelling */}
              <button
                onClick={() => selectQuickPrompt('Rekomendasi destinasi travelling liburan terbaik dan tips perjalanannya')}
                className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
              >
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <span>✈️ Travelling & Wisata Seru</span>
              </button>

              {/* Vadeel Clothing */}
              <button
                onClick={() => selectQuickPrompt('Ceritakan tentang brand clothing Vadeel Clothing')}
                className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
              >
                <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Shirt className="h-3.5 w-3.5" />
                </div>
                <span>👕 Brand Vadeel Clothing</span>
              </button>

              {/* Flitoo Food */}
              <button
                onClick={() => selectQuickPrompt('Jelaskan tentang brand makanan dan minuman Flitoo Food')}
                className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
              >
                <div className="p-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Utensils className="h-3.5 w-3.5" />
                </div>
                <span>🍔 Flitoo Food (Kuliner)</span>
              </button>

              {/* Jasa 3D Print Arata Manufacturing */}
              <button
                onClick={() => selectQuickPrompt('Jasa 3D print dan laser engraving di Arata Manufacturing')}
                className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
              >
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Printer className="h-3.5 w-3.5" />
                </div>
                <span>🖨️ Arata Manufacturing (3D Print & Laser)</span>
              </button>

              {/* REXEL ID */}
              <button
                onClick={() => selectQuickPrompt('Ceritakan tentang channel YouTube REXEL ID')}
                className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
              >
                <div className="p-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <Youtube className="h-3.5 w-3.5" />
                </div>
                <span>📺 REXEL ID (YouTube 200k+)</span>
              </button>
            </div>
          </div>
        )}

        {/* Apple Sleek Bottom Command Dock */}
        <div
          className={`relative flex flex-col rounded-3xl border transition-all ${
            isDragOver
              ? 'border-blue-500 ring-2 ring-blue-500/30'
              : 'border-black/10 dark:border-white/15'
          } bg-white/80 dark:bg-[#18181b]/85 backdrop-blur-2xl shadow-xl shadow-black/[0.04] dark:shadow-black/60 focus-within:border-black/25 dark:focus-within:border-white/30 focus-within:shadow-2xl`}
        >
          {/* Attached image preview pill inside dock */}
          {attachedImage && (
            <div className="mx-4 mt-3 flex items-center space-x-3 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] p-2">
              <img
                src={attachedImage.previewUrl}
                alt="Pratinjau"
                className="h-14 w-14 rounded-xl object-cover border border-black/10 dark:border-white/10"
              />
              <div className="flex-1 min-w-0 text-xs">
                <div className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                  {attachedImage.name}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Gambar terlampir • Adriannus AI siap menganalisis
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Hapus gambar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Top of input: Text Area */}
          <div className="px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Mendengarkan suara Anda... (Bicara sekarang)'
                  : attachedImage
                  ? 'Tanyakan sesuatu tentang gambar ini...'
                  : 'Tanyakan apa saja, minta buatkan gambar, atau lampirkan foto...'
              }
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
              style={{ minHeight: '38px', maxHeight: '160px' }}
            />
          </div>

          {/* Bottom toolbar inside dock */}
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            <div className="flex items-center space-x-1">
              {/* Quick Prompt (+) Menu */}
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-all ${
                  showQuickMenu ? 'bg-black/10 dark:bg-white/15 rotate-45' : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title="Pintasan & Opsi Cepat"
              >
                <Plus className="h-4 w-4 transition-transform duration-200" />
              </button>

              {/* Upload Image Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  attachedImage
                    ? 'bg-blue-500/10 text-[#0071e3] dark:text-[#2997ff]'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title="Unggah Gambar untuk Dibaca / Dianalisis"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Voice Dictation Mic */}
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white mic-pulsing'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={isListening ? 'Hentikan mendengarkan' : 'Dikte suara'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              {/* Apple-style Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={(!inputVal.trim() && !attachedImage) || isLoading}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
                  (inputVal.trim() || attachedImage) && !isLoading
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm shadow-black/20 hover:opacity-90'
                    : 'bg-black/5 text-slate-400 dark:bg-white/10 dark:text-zinc-600 cursor-not-allowed'
                }`}
                title="Kirim (Enter)"
              >
                {isLoading ? (
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-blue-400" />
                ) : (
                  <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer & Legal */}
        <div className="mt-2 text-center text-[11px] text-slate-400 dark:text-zinc-500 font-normal leading-relaxed">
          Adriannus AI dikembangkan oleh{' '}
          <span className="font-medium text-slate-700 dark:text-zinc-300">
            PT DHAFA TETAP BERUSAHA
          </span>
          . Dilindungi undang-undang.{' '}
          <button
            onClick={onOpenPrivacy}
            className="underline underline-offset-2 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
          >
            Baca kebijakan privasi
          </button>
        </div>
      </div>
    </div>
  );
};
